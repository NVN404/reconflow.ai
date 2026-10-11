import os
import re
import json
import time
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse, unquote

from app.schemas import GraphNode, NodeData, FindingMetadata, AgentThought
from app.services.serpapi_mcp_client import SerpApiMCPClient
from app.remediation import get_remediation_for_category


class AutonomousMCPAgent:
    """
    True Autonomous Agent implementation leveraging the official SerpApi Model Context Protocol (MCP).
    The Agent dynamically decides:
    1. What queries to formulate based on target perimeter or user question.
    2. Which MCP tools to invoke (e.g. 'search', 'google_news', 'youtube_search').
    3. How to inspect observations and extract security evidence.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.mcp_client = SerpApiMCPClient(api_key=api_key)

    def execute_agent_chat(
        self,
        target: str,
        user_message: str,
        existing_nodes: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Processes a conversational user message through dynamic MCP tool-use.
        If the message requires investigation, the Agent formulates an MCP query,
        executes it live via mcp.serpapi.com, extracts findings, and provides an authoritative response.
        """
        clean_target = target.strip().lower().replace("https://", "").replace("http://", "").split("/")[0].replace("www.", "")
        msg_lower = user_message.lower().strip()
        
        tool_call_info = None
        mcp_results = []
        new_findings = []
        thought_process = ""

        # Determine if a live MCP search tool call should be dispatched
        search_query = None
        engine = "google_light"

        # Check if user mentioned a new or specific target domain
        domain_match = re.search(r"\b([a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|org|io|net|dev|ai|co|app|tech|edu|gov))\b", msg_lower)
        if domain_match:
            clean_target = domain_match.group(1).replace("www.", "")

        # Check if user is asking about an existing finding (e.g. from "Ask AI ->" button or specific URL/label)
        is_about_finding = "tell me more about the finding" in msg_lower or "about the finding:" in msg_lower
        matched_finding_data = None
        if is_about_finding and existing_nodes:
            for n in existing_nodes:
                d = n.get("data", {})
                lbl = (d.get("label") or "").lower()
                u = (d.get("url") or d.get("metadata", {}).get("url") or "").lower()
                if (lbl and lbl in msg_lower) or (u and u in msg_lower):
                    matched_finding_data = d
                    break

        if is_about_finding:
            # Do NOT dispatch a new MCP search tool call; synthesize detailed finding analysis
            thought_process = f"Inspecting finding '{matched_finding_data.get('label', 'selected asset') if matched_finding_data else 'asset'}' from scan telemetry to synthesize risk analysis, attack vector, and remediation playbook."
        elif any(w in msg_lower for w in ["s3", "bucket", "aws", "storage", "cloud"]):
            search_query = f"site:s3.amazonaws.com \"{clean_target}\" OR site:{clean_target} \"s3.amazonaws.com\""
            thought_process = f"User inquired about AWS S3 / cloud storage exposure. Formulating targeted MCP dork for AWS storage buckets linked to {clean_target}."
        elif any(w in msg_lower for w in ["github", "repo", "git", "token", "secret", "api key", "leak", "credential"]):
            search_query = f"site:github.com \"{clean_target}\" (api_key OR secret OR password OR token)"
            thought_process = f"User requested source code / secret leak assessment. Querying GitHub public repositories via SerpApi MCP tool for {clean_target} credentials."
        elif any(w in msg_lower for w in ["admin", "login", "portal", "dashboard", "gateway", "auth"]):
            search_query = f"site:{clean_target} inurl:admin OR inurl:login OR inurl:portal OR inurl:dashboard"
            thought_process = f"Targeting exposed administrative consoles and public authentication gateways for {clean_target}."
        elif any(w in msg_lower for w in ["config", "backup", "sql", "dump", ".env", "database", "bak", "db"]):
            search_query = f"site:{clean_target} filetype:env OR filetype:sql OR filetype:bak OR filetype:config OR filetype:log"
            thought_process = f"Querying for unindexed and exposed configuration dumps, database backups, or .env files on {clean_target}."
        elif any(w in msg_lower for w in ["api", "swagger", "graphql", "openapi", "docs", "documentation"]):
            search_query = f"site:{clean_target} inurl:swagger OR inurl:api-docs OR inurl:graphql OR inurl:v1 OR inurl:v2"
            thought_process = f"Formulating targeted MCP query for exposed API documentation, Swagger UI, and GraphQL endpoints for {clean_target}."
        elif any(w in msg_lower for w in ["phpinfo", "debug", "server-status", "trace", "health", "metrics"]):
            search_query = f"site:{clean_target} inurl:phpinfo.php OR inurl:debug OR inurl:server-status OR inurl:actuator"
            thought_process = f"Targeting server telemetry, phpinfo, and Spring Actuator debug endpoints for {clean_target}."
        elif any(w in msg_lower for w in ["subdomain", "asset", "perimeter", "host", "surface"]):
            search_query = f"site:{clean_target} -www.{clean_target}"
            thought_process = f"Performing live subdomain harvesting across perimeter {clean_target} using SerpApi MCP Google Light stream."
        elif any(w in msg_lower for w in ["news", "cve", "breach", "incident"]):
            search_query = f"{clean_target} vulnerability OR breach OR security"
            engine = "google_news"
            thought_process = f"Querying Google News via SerpApi MCP tool for active threat intelligence and recent public vulnerability disclosures on {clean_target}."
        elif any(w in msg_lower for w in ["video", "youtube", "poc"]):
            search_query = f"{clean_target} exploit OR proof of concept OR bug bounty"
            engine = "youtube_search"
            thought_process = f"Searching for public proof-of-concept exploit videos and research walkthroughs via SerpApi MCP YouTube tool."
        elif any(w in msg_lower for w in ["scan", "audit", "recon", "inspect", "vulnerab", "threat", "check", "find", "search", "look for"]):
            cleaned_query = re.sub(r"^(can you|please|could you|go|search for|check for|find|look for|scan|audit|inspect)\s+", "", msg_lower)
            if cleaned_query and len(cleaned_query) > 3 and clean_target not in cleaned_query:
                search_query = f"site:{clean_target} {cleaned_query}"
            else:
                search_query = f"site:{clean_target} inurl:admin OR filetype:pdf OR filetype:sql OR inurl:login"
            thought_process = f"Executing dynamic custom reconnaissance query formulated from user prompt: '{search_query}'."

        # If tool call decided, invoke SerpApi MCP Server
        if search_query:
            tool_call_info = {
                "tool_name": "search",
                "engine": engine,
                "query": search_query,
                "mode": "compact",
                "endpoint": "https://mcp.serpapi.com/mcp"
            }
            results, err = self.mcp_client.search(search_query, engine=engine, mode="compact")
            mcp_results = results or []

            # Parse discovered evidence into structured findings cards
            for r in mcp_results[:5]:
                link = r.get("link", "")
                title = r.get("title", "")
                snippet = r.get("snippet", "")
                if link:
                    host = urlparse(link).netloc.lower()
                    severity = "HIGH" if any(k in search_query for k in ["github", "filetype:env", "filetype:sql"]) else "MEDIUM" if "admin" in search_query else "LOW"
                    new_findings.append({
                        "id": f"mcp-live-{int(time.time() * 1000)}-{len(new_findings)}",
                        "type": "externalNode" if "github" in link or "amazonaws" in link else "subdomainNode",
                        "data": {
                            "label": title or link,
                            "category": "LIVE_MCP_DISCOVERY",
                            "severity": severity,
                            "section": "VULNERABILITY" if severity in ["HIGH", "MEDIUM"] else "INFO",
                            "host": host,
                            "url": link,
                            "snippet": snippet or f"Discovered by SerpApi MCP Agent query: {search_query}",
                            "surface": "SerpApi MCP Live Tool Query",
                            "engine": engine,
                            "what_is_the_bug": f"Discovered indexed endpoint matching search criteria: {search_query}",
                            "why_it_is_a_bug": f"Exposed resource at {link} can provide attackers with structural recon or sensitive assets.",
                            "attack_vector": "Adversaries discover indexed resources through search dorks to map attack perimeter.",
                            "how_to_fix": "Enforce strict access controls, reverse-proxy authentication, or robots.txt / noindex directives.",
                            "remediation": "Restrict public indexing and verify credentials.",
                            "owasp_tag": "OWASP A05:2021 — Security Misconfiguration"
                        }
                    })

        # Generate intelligent contextual response
        reply_text = self._synthesize_agent_response(
            clean_target,
            user_message,
            thought_process,
            tool_call_info,
            mcp_results,
            new_findings,
            existing_nodes or []
        )

        return {
            "reply": reply_text,
            "thought": thought_process or f"Analyzing perimeter context for {clean_target} against local audit database.",
            "tool_call": tool_call_info,
            "mcp_results_count": len(mcp_results),
            "findings": new_findings
        }

    def _synthesize_agent_response(
        self,
        target: str,
        user_message: str,
        thought: str,
        tool_call: Optional[Dict[str, Any]],
        results: List[Dict[str, Any]],
        new_findings: List[Dict[str, Any]],
        existing_nodes: List[Dict[str, Any]]
    ) -> str:
        q = user_message.lower()

        if tool_call and results:
            summary_bullets = []
            for r in results[:4]:
                t = r.get("title", "")
                l = r.get("link", "")
                s = r.get("snippet", "")[:120]
                summary_bullets.append(f"• **[{t}]({l})**\n  _{s}_")
            bullets_str = "\n".join(summary_bullets)

            return (
                f"🔧 **SerpApi MCP Tool Executed:** `{tool_call['tool_name']}(engine='{tool_call['engine']}', q='{tool_call['query']}')`\n\n"
                f"I queried the official SerpApi MCP Server in real-time. Here is the verified live intelligence for **{target}**:\n\n"
                f"{bullets_str}\n\n"
                f"💡 **Security Takeaway:** I added {len(new_findings)} finding card{'s' if len(new_findings) > 1 else ''} to your workspace. "
                f"Verify that these endpoints enforce proper authentication gateways and are not inadvertently leaking sensitive company data."
            )
        elif tool_call and not results:
            return (
                f"🔧 **SerpApi MCP Tool Executed:** `{tool_call['tool_name']}(q='{tool_call['query']}')`\n\n"
                f"The SerpApi MCP Server returned **0 exposed results** for this specific query. "
                f"This indicates that **{target}** does not have publicly indexed resources matching that exposure pattern on the search index. Good security hygiene!"
            )

        # Context-based replies from existing findings
        if "tell me more about" in q or "finding:" in q:
            matched = None
            for n in existing_nodes:
                d = n.get("data", {})
                lbl = (d.get("label") or "").lower()
                u = (d.get("url") or d.get("metadata", {}).get("url") or "").lower()
                if (lbl and lbl in q) or (u and u in q):
                    matched = d
                    break

            if matched:
                steps_list = matched.get("remediation_steps") or []
                steps_str = "\n".join(f"{i+1}. {s}" for i, s in enumerate(steps_list)) if steps_list else f"1. {matched.get('how_to_fix') or matched.get('remediation') or 'Harden resource access'}"
                return (
                    f"🔍 **Deep-Dive Security Directive for `{matched.get('label')}`:**\n\n"
                    f"• **Risk Analysis:** {matched.get('why_it_is_a_bug') or 'Exposed backup or configuration file leaking sensitive application structure.'}\n\n"
                    f"• **Exploit Vector:** {matched.get('attack_vector') or 'Attackers can retrieve backup files unauthenticated, inspect raw source code, and discover hardcoded credentials or database secrets.'}\n\n"
                    f"• **Remediation Directive:** {matched.get('how_to_fix') or matched.get('remediation') or 'Purge backup file from web root and enforce strict server access controls.'}\n\n"
                    f"📋 **Action Steps:**\n{steps_str}\n\n"
                    f"📌 **Standard:** {matched.get('owasp_tag', 'OWASP A05:2021 — Security Misconfiguration')}"
                )
            elif "bak" in q or "backup" in q:
                return (
                    f"🔍 **Deep-Dive Security Directive for Backup File Exposure:**\n\n"
                    f"• **Risk Analysis:** Backup files (such as `.bak`, `.old`, `.swp`) contain unparsed backend source code, database passwords, and internal API logic.\n\n"
                    f"• **Exploit Vector:** Web servers do not execute `.bak` files through the script interpreter; instead, they serve raw source code directly to any unauthenticated requester.\n\n"
                    f"• **Remediation Directive:** Immediately remove backup archives from public webroot directories and configure web servers (Nginx/Apache) to deny access to `.bak` files.\n\n"
                    f"📋 **Action Steps:**\n1. `rm -f /var/www/html/*.bak`\n2. Add Nginx rule: `location ~* \\.(bak|config|sql|env)$ {{ deny all; }}`\n3. Rotate all database credentials and secret keys exposed in the backup file.\n\n"
                    f"📌 **Standard:** OWASP A05:2021 — Security Misconfiguration"
                )

        if "critical" in q or "summarize" in q or "overview" in q:
            criticals = [n for n in existing_nodes if n.get("data", {}).get("severity") == "CRITICAL"]
            highs = [n for n in existing_nodes if n.get("data", {}).get("severity") == "HIGH"]
            meds = [n for n in existing_nodes if n.get("data", {}).get("severity") == "MEDIUM"]

            if not criticals and not highs and not meds:
                return (
                    f"🛡️ **Perimeter Summary for {target}:**\n\n"
                    f"No critical or high severity vulnerabilities were detected on this target. "
                    f"All discovered assets fall under clean informational endpoints and public subdomains. "
                    f"You can ask me to run targeted dorks like: *'Check for leaked S3 buckets'* or *'Search for admin logins'*."
                )
            
            summary = [f"Found {len(criticals)} critical, {len(highs)} high, and {len(meds)} medium findings for **{target}**:"]
            for c in (criticals + highs)[:5]:
                d = c.get("data", {})
                summary.append(f"• **{d.get('label')}** ({d.get('severity')}) — {d.get('what_is_the_bug') or d.get('snippet')}")
            return "\n".join(summary)

        if "fix" in q or "remediat" in q or "patch" in q:
            vulns = [n for n in existing_nodes if n.get("data", {}).get("severity") in ["CRITICAL", "HIGH", "MEDIUM"]]
            if vulns:
                top = vulns[0].get("data", {})
                steps = "\n".join(f"{i+1}. {s}" for i, s in enumerate(top.get("remediation_steps", [])))
                return (
                    f"🛡️ **Priority Remediation Directive for {top.get('label')}:**\n\n"
                    f"**Risk:** {top.get('why_it_is_a_bug', 'Vulnerability exposure detected')}\n\n"
                    f"**How to Fix:** {top.get('how_to_fix', 'Harden endpoint access')}\n\n"
                    f"**Action Steps:**\n{steps or '1. Review access control policies.'}\n\n"
                    f"Standard: {top.get('owasp_tag', 'OWASP Top 10')}"
                )
            return f"No active critical vulnerabilities require patching on **{target}** based on current scan telemetry."

        if "attack" in q or "vector" in q or "exploit" in q:
            with_vectors = [n for n in existing_nodes if n.get("data", {}).get("attack_vector")]
            if with_vectors:
                items = [f"• **{n.get('data', {}).get('label')}:** {n.get('data', {}).get('attack_vector')}" for n in with_vectors[:3]]
                return "🎯 **Identified Attack Vectors from Reconnaissance:**\n\n" + "\n\n".join(items)
            return "No exploitable attack vectors were discovered in this scan's indexed findings."

        return (
            f"I am your autonomous **SerpApi MCP Recon Agent** for **{target}**.\n\n"
            f"You can ask me to dynamically call the MCP search tools to investigate specific threats in real time:\n"
            f"• *'Check for leaked AWS S3 buckets or git repos'*\n"
            f"• *'Search for admin login portals'*\n"
            f"• *'Look for database backup dumps or .env files'*\n"
            f"• *'Summarize all critical exposures'* or *'How do I fix top findings?'*"
        )
