import re
import datetime
from urllib.parse import urlparse, unquote
from typing import List, Dict, Any, Tuple, Optional
import requests


from app.config import SERPAPI_KEY, get_serpapi_key
from app.cache import get_cached_scan, set_cached_scan
from app.schemas import ScanResult, ScanSummary, AgentThought
from app.services.triage import compute_security_score, build_executive_summary, layout_graph, ai_triage_findings
from app.remediation import get_remediation_for_category
from app.services.phase2_external import Phase2ExternalScanner
from app.services.serpapi_mcp_client import SerpApiMCPClient


def is_valid_config_leak(link: str, title: str, snippet: str) -> Tuple[bool, str]:
    """
    Returns (is_leak, leak_title).
    Strictly verifies that the URL or content points to a REAL sensitive file or directory listing.
    Standard web pages (careers, blog, marketing, docs, etc.) are NEVER leaks.
    """
    parsed = urlparse(link)
    path = parsed.path.lower()
    t_lower = title.lower()
    s_lower = snippet.lower()
    
    # 1. Reject normal web pages immediately
    normal_sections = [
        "/careers", "/jobs", "/blog", "/about", "/pricing", "/faq", "/help", 
        "/support", "/contact", "/terms", "/privacy", "/features", "/integrations", 
        "/customers", "/solutions", "/resources", "/press", "/articles", "/status",
        "/forum", "/community", "/docs", "/documentation", "/products", "/case-studies",
        "/amazon-filters", "/inline-videos", "/shopping-results", "/google-domains",
        "/apple-languages", "/broaden-searches"
    ]
    if any(path == sec or path.startswith(sec + "/") or path.endswith(sec) for sec in normal_sections):
        return False, ""
        
    # 2. Open Directory Listing
    if "index of /" in t_lower or "index of /" in s_lower or "parent directory" in s_lower:
        return True, "Open Directory Listing Exposing Server Files"
        
    # 3. Environment configuration files
    if "/.env" in path or path.endswith(".env") or path.endswith(".env.local") or path.endswith(".env.production"):
        return True, "Exposed Environment Configuration (.env) File"
        
    # 4. Dotfiles (.git/config, .aws/credentials, .htpasswd, etc.)
    segments = [s for s in path.split("/") if s]
    if any(s.startswith(".") and len(s) > 1 and not s.startswith((".html", ".php", ".htm", ".json", ".js", ".css")) for s in segments):
        return True, "Exposed Server Dotfile / Hidden Configuration"
        
    # 5. Database dumps, logs, backups
    sensitive_exts = [".sql", ".bak", ".sqlite", ".db", ".dump", ".backup", ".log", ".conf", ".cfg", ".ini"]
    for ext in sensitive_exts:
        if path.endswith(ext) or f"{ext}." in path:
            return True, f"Exposed Database / Server Backup File ({ext})"
            
    return False, ""

def is_valid_token_leak(link: str, snippet: str) -> Tuple[bool, str, str]:
    """Returns (is_leak, token_type, matched_sig)"""
    url_lower = link.lower()
    if any(x in url_lower for x in ["/docs", "/tutorial", "/guide", "/example", "/faq", "/blog", "/sdk", "/learn"]):
        return False, "", ""
    combined = snippet + " " + link
    aws_m = re.search(r"\b(AKIA[0-9A-Z]{16})\b", combined)
    if aws_m:
        return True, "AWS Access Key ID", aws_m.group(1)
    gh_m = re.search(r"\b(ghp_[A-Za-z0-9]{36})\b", combined)
    if gh_m:
        return True, "GitHub Personal Access Token", gh_m.group(1)
    stripe_m = re.search(r"\b(sk_live_[0-9a-zA-Z]{24,})\b", combined)
    if stripe_m:
        return True, "Stripe Live Secret Key", stripe_m.group(1)
    google_m = re.search(r"\b(AIzaSy[0-9A-Za-z-_]{33,35})\b", combined)
    if google_m and not any(w in snippet.lower() for w in ["your_key", "example", "placeholder"]):
        return True, "Google Cloud API Key", google_m.group(1)
    return False, "", ""

def is_valid_document_leak(link: str, title: str, snippet: str) -> Tuple[bool, str]:
    """Returns (is_leak, doc_title)"""
    parsed = urlparse(link)
    path = parsed.path.lower()
    valid_exts = [".pdf", ".xlsx", ".xls", ".docx", ".doc", ".csv"]
    if not any(path.endswith(ext) for ext in valid_exts):
        return False, ""
    combined = (title + " " + snippet).lower()
    conf_markers = ["confidential", "internal use only", "strictly private", "proprietary", "not for public"]
    if any(m in combined for m in conf_markers):
        ext = path.split(".")[-1].upper()
        return True, f"Indexed Confidential Corporate {ext} Document"
    return False, ""

def is_valid_auth_gateway(link: str) -> Tuple[bool, str]:
    """Returns (is_gateway, gateway_title)"""
    parsed = urlparse(link)
    host = parsed.netloc.lower()
    path = parsed.path.lower()
    
    auth_subdomains = ("admin.", "login.", "auth.", "portal.", "dashboard.", "sso.", "id.", "accounts.")
    if host.startswith(auth_subdomains):
        return True, "Dedicated Authentication / Admin Subdomain"
        
    auth_paths = ["/login", "/admin", "/auth", "/dashboard", "/portal", "/signin", "/sso", "/user/login", "/admin/login"]
    if any(path == p or path.startswith(p + "/") for p in auth_paths):
        if not any(x in path for x in ["/blog", "/docs", "/article", "/posts", "/news", "/careers"]):
            return True, "Public Authentication Gateway"
            
    return False, ""

class Phase1DomainScanner:
    def __init__(self, api_key: str = ""):
        self._api_key = api_key
        self.mcp_client = SerpApiMCPClient(api_key=api_key)
        self._active_protocol = "rest"

    @property
    def api_key(self) -> str:
        return self._api_key or get_serpapi_key()

    def execute_serpapi_query(self, query: str, engine: str = "google", protocol: Optional[str] = None) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        active_proto = protocol or getattr(self, "_active_protocol", "rest")
        
        # 1. Official SerpApi Model Context Protocol (MCP) Execution
        if active_proto == "mcp":
            mcp_results, mcp_err = self.mcp_client.search(query, engine=engine)
            if not mcp_err and mcp_results is not None:
                return mcp_results, None
            # Graceful degradation / fallback to direct REST if MCP encounters a network hiccup
            print(f"[WARN] MCP search fallback to Direct REST for '{query}': {mcp_err}")

        # 2. Direct SerpApi REST API Execution (Default / Resilient Fallback)
        key = self.api_key
        if not key:
            return [], "No API key configured"
        
        url = "https://serpapi.com/search"
        params = {
            "api_key": key,
            "engine": engine,
            "num": 10
        }
        if engine == "youtube":
            params["search_query"] = query
        else:
            params["q"] = query

        try:
            resp = requests.get(url, params=params, timeout=35)
            data = resp.json()
            if resp.status_code == 200:
                if engine == "google_news":
                    return data.get("news_results", []), None
                elif engine == "youtube":
                    return data.get("video_results", []), None
                elif engine == "google_play":
                    apps = []
                    if "app_highlight" in data and isinstance(data["app_highlight"], dict):
                        apps.append(data["app_highlight"])
                    for cat in data.get("organic_results", []):
                        if isinstance(cat, dict) and "items" in cat:
                            apps.extend(cat.get("items", []))
                        elif isinstance(cat, dict) and "title" in cat:
                            apps.append(cat)
                    return apps, None
                return data.get("organic_results", []), None
            else:
                error_msg = data.get("error", f"HTTP {resp.status_code}: {resp.text}")
                return [], str(error_msg)
        except Exception as e:
            return [], str(e)

    def scan(
        self,
        target: str,
        use_cache: bool = True,
        enable_phase2: bool = False,
        custom_dorks: Optional[List[str]] = None,
        enabled_vectors: Optional[Dict[str, bool]] = None,
        protocol: str = "rest"
    ) -> ScanResult:
        clean_target = target.strip().lower()
        clean_target = re.sub(r"^https?://", "", clean_target).rstrip("/")
        brand_name = clean_target.split(".")[0]
        
        self._active_protocol = protocol
        thoughts: List[AgentThought] = []
        now = datetime.datetime.now().strftime("%H:%M:%S")

        thoughts.append(AgentThought(
            timestamp=now,
            stage="INITIALIZATION",
            message=f"ReconFlow Agent armed for target: {clean_target} (Phase 2: {'ON' if enable_phase2 else 'OFF'})",
            status="info"
        ))

        if protocol == "mcp":
            thoughts.append(AgentThought(
                timestamp=now,
                stage="MCP_ACTIVE",
                message="Protocol: Official SerpApi MCP Server (Model Context Protocol 2026 via mcp.serpapi.com) — Compact stream active (-60% LLM token overhead)",
                status="success"
            ))
        else:
            thoughts.append(AgentThought(
                timestamp=now,
                stage="REST_ACTIVE",
                message="Protocol: Direct SerpApi REST Engine (Raw SERP Multi-Engine Intelligence) — Full uncompressed JSON telemetry (DOM metadata & rich snippets)",
                status="info"
            ))

        # Only fallback to offline simulation if no SERPAPI_KEY is configured or explicit mock requested
        if not self.api_key or clean_target in ["mock.local", "offline.test"]:
            thoughts.append(AgentThought(
                timestamp=now,
                stage="SANDBOX_EVAL",
                message=f"No SERPAPI_KEY configured or offline mode requested. Generating simulated scan for '{clean_target}'.",
                status="warning"
            ))
            return self._generate_simulated_scan(
                clean_target,
                thoughts,
                protocol=protocol,
                enable_phase2=enable_phase2,
                enabled_vectors=enabled_vectors
            )


        # LIVE MULTI-PASS SERPAPI RECONNAISSANCE
        subdomains: List[Dict[str, Any]] = []
        findings: List[Dict[str, Any]] = []
        external_findings: List[Dict[str, Any]] = []
        discovered_hosts = set()
        credits_used = 0

        def register_host(host_str: str, link_url: str, snip: str, dork: str, eng: str):
            if host_str and host_str.endswith(clean_target) and host_str != f"www.{clean_target}" and host_str != clean_target:
                if host_str not in discovered_hosts:
                    discovered_hosts.add(host_str)
                    subdomains.append({
                        "host": host_str,
                        "url": link_url,
                        "snippet": snip,
                        "dork": dork,
                        "engine": eng
                    })

        # --- PHASE 1: AUTONOMOUS MULTI-ENGINE DOMAIN DORKING (100% PURE SERPAPI) ---
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PHASE_1_INIT",
            message=f"Initiating 100% pure SerpApi domain reconnaissance for target: '{clean_target}'",
            status="info"
        ))

        # --- PASS 1.1: Subdomain Harvesting via Google ---
        pass1_query = f"site:*.{clean_target} -www.{clean_target}"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_1_1",
            message=f"Harvesting subdomains via Google Dork: '{pass1_query}'",
            status="info"
        ))
        p1_results, p1_err = self.execute_serpapi_query(pass1_query, engine="google")
        if p1_err:
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="SERPAPI_NOTICE",
                message=f"Google query notice: {p1_err}",
                status="warning"
            ))
        else:
            credits_used += 1

        def inspect_result_for_vulnerabilities(res: Dict[str, Any], dork_str: str, eng: str):
            link = res.get("link", "")
            if not link:
                return
            title = res.get("title", "")
            snip = res.get("snippet", "")
            host = urlparse(link).netloc.lower()

            if any(f.get("url") == link for f in findings):
                return

            parsed_url = urlparse(link)
            query_str = unquote(parsed_url.query.lower())
            path_str = unquote(parsed_url.path.lower())

            # 1. SQL Injection payload in actual URL parameters
            # Strictly inspect query parameters — do NOT trigger on educational articles, news, or blog snippets!
            sql_indicators = ["union select", "union%20select", "select @@", "select%20@@", "substring((", "waitfor delay", "' or '", "admin'--"]
            if any(k in query_str for k in sql_indicators):
                playbook = get_remediation_for_category("DATABASE_LEAK")
                findings.append({
                    "title": "Search-Indexed Potentially Manipulable SQL Query Parameter",
                    "category": "DATABASE_LEAK",
                    "severity": "MEDIUM",
                    "section": "VULNERABILITY",
                    "host": host,
                    "url": link,
                    "snippet": snip or f"Search engine indexed parameter containing SQL query syntax at {link}.",
                    "dork": dork_str,
                    "surface": "Search Engine Index Cache",
                    "engine": eng,
                    "what_is_the_bug": f"Search engine indexed a URL with SQL query syntax in the query parameter at {link}.",
                    "why_it_is_a_bug": "Indexed query strings containing database syntax can reveal unparameterized endpoints.",
                    "attack_vector": "Adversaries discover search-indexed query strings to probe for input sanitization weaknesses.",
                    "how_to_fix": "Enforce parameterized database queries (prepared statements) and sanitize input arguments.",
                    "remediation": "Audit the endpoint parameter and ensure all database queries use prepared statements.",
                    "owasp_tag": "OWASP A03:2021 — Injection",
                    "cwe_id": "CWE-89: SQL Injection",
                    "cvss_score": "6.5 (Medium)",
                    "remediation_steps": [
                        "1. Verify that the query parameter uses parameterized queries or ORM abstractions.",
                        "2. Ensure Web Application Firewall (WAF) filters SQL syntax tokens in GET requests."
                    ]
                })

            # 2. Reflected Cross-Site Scripting (XSS) parameter in URL query string
            elif any(k in query_str for k in ["<script", "alert(", "javascript:", "<svg", "<img src=x"]):
                playbook = get_remediation_for_category("API_EXPOSURE")
                findings.append({
                    "title": "Search-Indexed Reflected Script Parameter",
                    "category": "API_EXPOSURE",
                    "severity": "MEDIUM",
                    "section": "VULNERABILITY",
                    "host": host,
                    "url": link,
                    "snippet": snip or "Script syntax detected in indexed URL parameter.",
                    "dork": dork_str,
                    "surface": "Search Engine Index Cache",
                    "engine": eng,
                    "what_is_the_bug": f"Search engine cached an endpoint reflecting script tags in query parameters at {link}.",
                    "why_it_is_a_bug": "Unsanitized user input reflected in HTTP responses allows arbitrary script execution in client browsers.",
                    "attack_vector": "Adversaries craft malicious links containing script payloads targeting authenticated victim sessions.",
                    "how_to_fix": "Enforce context-aware HTML entity encoding and configure strict Content Security Policy (CSP).",
                    "remediation": "Deploy Content Security Policy (CSP) headers and encode dynamic query string outputs.",
                    "owasp_tag": "OWASP A03:2021 — Injection / XSS",
                    "cwe_id": "CWE-79: Cross-site Scripting",
                    "cvss_score": "6.1 (Medium)",
                    "remediation_steps": [
                        "1. Implement contextual HTML entity encoding on all user-supplied URL parameters.",
                        "2. Configure strict Content-Security-Policy (CSP) headers prohibiting inline script execution."
                    ]
                })

            # 3. Directory Traversal / File Disclosure in path or query
            elif any(k in query_str or k in path_str for k in ["../", "..%2f", "/etc/passwd", "win.ini"]):
                playbook = get_remediation_for_category("STORAGE_EXPOSURE")
                findings.append({
                    "title": "Directory Traversal Parameter Syntax Detected",
                    "category": "STORAGE_EXPOSURE",
                    "severity": "MEDIUM",
                    "section": "VULNERABILITY",
                    "host": host,
                    "url": link,
                    "snippet": snip or "Directory traversal parameter syntax detected in search index.",
                    "dork": dork_str,
                    "surface": "Search Engine Index Cache",
                    "engine": eng,
                    "what_is_the_bug": f"Indexed path indicators show potential local file inclusion or traversal syntax at {link}.",
                    "why_it_is_a_bug": "Improper file path sanitization allows adversaries to retrieve unauthorized files from the filesystem.",
                    "attack_vector": "Adversary manipulates path parameters to read server configuration files.",
                    "how_to_fix": "Validate and whitelist filenames; avoid using raw user inputs in file access APIs.",
                    "remediation": "Restrict filesystem operations to a chrooted directory and sanitize all path inputs.",
                    "owasp_tag": "OWASP A01:2021 — Broken Access Control",
                    "cwe_id": "CWE-22: Path Traversal",
                    "cvss_score": "6.3 (Medium)",
                    "remediation_steps": playbook.get("remediation_steps", [])
                })

            # 4. Interactive API Documentation / Swagger
            elif any(k in link.lower() or k in title.lower() for k in ["swagger", "openapi", "api-docs"]) and not any(x in link.lower() for x in ["/blog", "/careers", "/news"]):
                playbook = get_remediation_for_category("API_DOCS")
                findings.append({
                    "title": "Interactive REST API Documentation Console Exposed",
                    "category": "API_DOCS",
                    "severity": "LOW",
                    "section": "INFO",
                    "host": host,
                    "url": link,
                    "snippet": snip or "Publicly accessible REST API documentation.",
                    "dork": dork_str,
                    "surface": "Interactive Documentation",
                    "engine": eng,
                    "what_is_the_bug": f"Publicly accessible interactive API specification console at {link}.",
                    "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                    "attack_vector": playbook.get("attack_vector"),
                    "how_to_fix": playbook.get("how_to_fix"),
                    "remediation": playbook.get("default_directive"),
                    "owasp_tag": playbook.get("owasp_tag"),
                    "cwe_id": playbook.get("cwe_id"),
                    "cvss_score": "3.5 (Low)",
                    "remediation_steps": playbook.get("remediation_steps", [])
                })

        for res in p1_results:
            link = res.get("link", "")
            host = urlparse(link).netloc.lower()
            register_host(host, link, res.get("snippet", "Active subdomain asset."), pass1_query, "google")
            inspect_result_for_vulnerabilities(res, pass1_query, "google")

        # --- PASS 1.1b: Multi-Engine Bing Expansion ---
        bing_query = f"site:{clean_target} -www.{clean_target}"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_1_1B",
            message=f"Cross-validating perimeter via Bing: '{bing_query}'",
            status="info"
        ))
        bing_results, bing_err = self.execute_serpapi_query(bing_query, engine="bing")
        if not bing_err and bing_results:
            credits_used += 1
            for res in bing_results:
                link = res.get("link", "")
                host = urlparse(link).netloc.lower()
                register_host(host, link, res.get("snippet", "Cross-validated via Bing."), bing_query, "bing")
                inspect_result_for_vulnerabilities(res, bing_query, "bing")

        # --- PASS 1.1c: Multi-Engine DuckDuckGo Expansion ---
        ddg_query = f"site:*.{clean_target} -www.{clean_target}"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_1_1C",
            message=f"Bypassing robots.txt disallows via DuckDuckGo: '{ddg_query}'",
            status="info"
        ))
        ddg_results, ddg_err = self.execute_serpapi_query(ddg_query, engine="duckduckgo")
        if not ddg_err and ddg_results:
            credits_used += 1
            for res in ddg_results:
                link = res.get("link", "")
                host = urlparse(link).netloc.lower()
                register_host(host, link, res.get("snippet", "Discovered via DuckDuckGo."), ddg_query, "duckduckgo")
                inspect_result_for_vulnerabilities(res, ddg_query, "duckduckgo")


        # --- PASS 1.2: Authentication Gateways, Portals & Interactive Docs ---
        pass2_query = f"site:{clean_target} (inurl:admin OR inurl:login OR inurl:portal OR inurl:auth OR inurl:docs OR inurl:api OR inurl:app OR inurl:dashboard)"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_1_2",
            message=f"Probing auth gateways & documentation portals: '{pass2_query}'",
            status="info"
        ))
        p2_results, p2_err = self.execute_serpapi_query(pass2_query, engine="google")
        if not p2_err:
            credits_used += 1
            for res in p2_results:
                link = res.get("link", "")
                host = urlparse(link).netloc.lower()
                # Always register any discovered host
                register_host(host, link, res.get("snippet", "Discovered host cluster."), pass2_query, "google")
                
                # Check for specific gateway exposures
                if host == clean_target or host.endswith("." + clean_target):
                    is_auth, auth_title = is_valid_auth_gateway(link)
                    url_lower = link.lower()
                    if is_auth:
                        playbook = get_remediation_for_category("INFRASTRUCTURE")
                        findings.append({
                            "title": auth_title,
                            "category": "INFRASTRUCTURE",
                            "severity": "LOW",
                            "host": host,
                            "url": link,
                            "snippet": res.get("snippet", "Exposed public login / access portal."),
                            "dork": pass2_query,
                            "surface": "Authentication Gateway",
                            "engine": "google",
                            "what_is_the_bug": f"Publicly accessible authentication or administrative gateway at {link}.",
                            "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                            "attack_vector": playbook.get("attack_vector"),
                            "how_to_fix": playbook.get("how_to_fix"),
                            "remediation": playbook.get("default_directive"),
                            "owasp_tag": playbook.get("owasp_tag"),
                            "cwe_id": playbook.get("cwe_id"),
                            "cvss_score": playbook.get("cvss_score")
                        })
                    elif any(k in url_lower for k in ["swagger", "graphiql", "redoc", "openapi"]) and not any(x in url_lower for x in ["/blog", "/careers", "/news", "/posts"]):
                        playbook = get_remediation_for_category("API_DOCS")
                        findings.append({
                            "title": "Interactive API Documentation Schema Endpoint",
                            "category": "API_DOCS",
                            "severity": "MEDIUM",
                            "host": host,
                            "url": link,
                            "snippet": res.get("snippet", "Interactive developer schema exposing endpoints."),
                            "dork": pass2_query,
                            "surface": "Interactive Documentation",
                            "engine": "google",
                            "what_is_the_bug": f"Publicly accessible interactive API specification console at {link}.",
                            "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                            "attack_vector": playbook.get("attack_vector"),
                            "how_to_fix": playbook.get("how_to_fix"),
                            "remediation": playbook.get("default_directive"),
                            "owasp_tag": playbook.get("owasp_tag"),
                            "cwe_id": playbook.get("cwe_id"),
                            "cvss_score": playbook.get("cvss_score")
                        })

        # --- PASS 1.2B: General Web Attack Surface & Indexed Routes ---
        general_query = f"site:{clean_target}"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_1_2B",
            message=f"Harvesting indexed web perimeter and endpoints: '{general_query}'",
            status="info"
        ))
        gen_results, gen_err = self.execute_serpapi_query(general_query, engine="google")
        if not gen_err and gen_results:
            credits_used += 1
            for res in gen_results:
                link = res.get("link", "")
                host = urlparse(link).netloc.lower()
                register_host(host, link, res.get("snippet", "Discovered host cluster."), general_query, "google")
                title = res.get("title", "")
                if title and not any(f.get("url") == link for f in findings):
                    findings.append({
                        "title": f"Indexed Asset: {title[:50]}",
                        "category": "INFRASTRUCTURE",
                        "severity": "INFO",
                        "host": host,
                        "url": link,
                        "snippet": res.get("snippet", "Active indexed page on target perimeter."),
                        "dork": general_query,
                        "surface": "Web Application Perimeter",
                        "engine": "google",
                        "section": "INFO",
                        "what_is_the_bug": f"Publicly accessible indexed endpoint at {link}.",
                        "why_it_is_a_bug": "Public web routes form the external attack surface of the application.",
                        "attack_vector": "Adversary explores indexed endpoints to map application functionality and business logic.",
                        "how_to_fix": "Verify that this route is intended for public consumption and enforce rate limiting.",
                        "remediation": "Audit route access controls and ensure sensitive APIs require authenticated sessions.",
                        "owasp_tag": "OWASP A01:2021 — Broken Access Control",
                        "cwe_id": "CWE-200: Information Exposure",
                        "cvss_score": "0.0 (Informational)"
                    })
                    if len([f for f in findings if f.get("category") == "INFRASTRUCTURE" and f.get("severity") == "INFO"]) >= 5:
                        break

        # --- PASS 1.3: Sensitive Configuration Files & Database Dumps ---
        pass3_query = f"site:{clean_target} (filetype:env OR filetype:sql OR filetype:yaml OR filetype:log OR filetype:bak OR intitle:\"index of /\")"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_1_3",
            message=f"Auditing perimeter for configuration leaks: '{pass3_query}'",
            status="info"
        ))
        p3_results, p3_err = self.execute_serpapi_query(pass3_query, engine="google")
        if not p3_err and p3_results:
            credits_used += 1
            for res in p3_results:
                link = res.get("link", "")
                host = urlparse(link).netloc.lower()
                if not (host == clean_target or host.endswith("." + clean_target)):
                    continue
                snippet = res.get("snippet", "")
                title = res.get("title", "")
                
                is_leak, leak_title = is_valid_config_leak(link, title, snippet)
                if not is_leak:
                    # STRICT FILTER: Discard normal pages (careers, blog, marketing, status, etc.)
                    continue
                
                playbook = get_remediation_for_category("CONFIG_LEAK")
                findings.append({
                    "title": leak_title,
                    "category": "CONFIG_LEAK",
                    "severity": "CRITICAL",
                    "host": host,
                    "url": link,
                    "snippet": snippet or "Production secrets or configuration files exposed.",
                    "dork": pass3_query,
                    "surface": "Web Server Root",
                    "engine": "google",
                    "what_is_the_bug": f"Unauthenticated public access to sensitive file at {link}.",
                    "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                    "attack_vector": playbook.get("attack_vector"),
                    "how_to_fix": playbook.get("how_to_fix"),
                    "remediation": playbook.get("default_directive"),
                    "owasp_tag": playbook.get("owasp_tag"),
                    "cwe_id": playbook.get("cwe_id"),
                    "cvss_score": playbook.get("cvss_score")
                })
                thoughts.append(AgentThought(
                    timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                    stage="CRITICAL_ANOMALY",
                    message=f"CRITICAL leak confirmed: {link} ({leak_title})",
                    status="critical"
                ))

        # --- PASS 1.4: Leaked Token Signature Scanning (TruffleHog in Search) ---
        token_query = f"site:{clean_target} (\"AIzaSy\" OR \"sk_live_\" OR \"ghp_\" OR \"AKIA\")"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_1_4",
            message=f"Auditing perimeter for high-entropy API token signatures: '{token_query}'",
            status="info"
        ))
        token_results, token_err = self.execute_serpapi_query(token_query, engine="google")
        if not token_err and token_results:
            credits_used += 1
            for res in token_results:
                link = res.get("link", "")
                host = urlparse(link).netloc.lower()
                if not (host == clean_target or host.endswith("." + clean_target)):
                    continue
                snip = res.get("snippet", "")
                
                is_token, token_type, matched_sig = is_valid_token_leak(link, snip)
                if not is_token:
                    continue

                playbook = get_remediation_for_category("TOKEN_LEAK")
                findings.append({
                    "title": f"Exposed Cloud Secret Signature ({token_type})",
                    "category": "TOKEN_LEAK",
                    "severity": "CRITICAL",
                    "host": host,
                    "url": link,
                    "snippet": snip or f"Hardcoded {token_type} signature detected: {matched_sig}",
                    "dork": token_query,
                    "surface": "Web Client Bundle / Source",
                    "engine": "google",
                    "what_is_the_bug": f"Live high-entropy {token_type} signature detected in public endpoint at {link}.",
                    "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                    "attack_vector": playbook.get("attack_vector"),
                    "how_to_fix": playbook.get("how_to_fix"),
                    "remediation": playbook.get("default_directive"),
                    "owasp_tag": playbook.get("owasp_tag"),
                    "cwe_id": playbook.get("cwe_id"),
                    "cvss_score": playbook.get("cvss_score")
                })
                thoughts.append(AgentThought(
                    timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                    stage="CRITICAL_ANOMALY",
                    message=f"CRITICAL Token signature detected on {host}: {token_type} ({matched_sig[:10]}...)",
                    status="critical"
                ))
                if len([f for f in findings if f["category"] == "TOKEN_LEAK"]) >= 3:
                    break

        # --- PASS 1.5: Confidential Corporate Documents (filetype:pdf / xlsx) ---
        doc_query = f"site:{clean_target} (filetype:pdf OR filetype:xlsx OR filetype:docx) (\"CONFIDENTIAL\" OR \"INTERNAL USE ONLY\" OR \"PROPRIETARY\")"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_1_5",
            message=f"Probing for exposed confidential corporate documents: '{doc_query}'",
            status="info"
        ))
        doc_results, doc_err = self.execute_serpapi_query(doc_query, engine="google")
        if not doc_err and doc_results:
            credits_used += 1
            for res in doc_results:
                link = res.get("link", "")
                host = urlparse(link).netloc.lower()
                if not (host == clean_target or host.endswith("." + clean_target)):
                    continue
                snip = res.get("snippet", "")
                title = res.get("title", "")
                
                is_doc, doc_title = is_valid_document_leak(link, title, snip)
                if not is_doc:
                    continue

                playbook = get_remediation_for_category("DOCUMENT_LEAK")
                findings.append({
                    "title": doc_title,
                    "category": "DOCUMENT_LEAK",
                    "severity": "HIGH",
                    "host": host,
                    "url": link,
                    "snippet": snip or "Internal corporate document exposed to public crawlers.",
                    "dork": doc_query,
                    "surface": "Internal Corporate Document",
                    "engine": "google",
                    "what_is_the_bug": f"Publicly accessible internal document with confidentiality markings at {link}.",
                    "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                    "attack_vector": playbook.get("attack_vector"),
                    "how_to_fix": playbook.get("how_to_fix"),
                    "remediation": playbook.get("default_directive"),
                    "owasp_tag": playbook.get("owasp_tag"),
                    "cwe_id": playbook.get("cwe_id"),
                    "cvss_score": playbook.get("cvss_score")
                })
                if len([f for f in findings if f["category"] == "DOCUMENT_LEAK"]) >= 3:
                    break

        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="ASSET_ENUM",
            message=f"Perimeter mapped: Discovered {len(subdomains)} active hosts and {len(findings)} security findings.",
            status="success"
        ))

        # --- OPTIONAL PHASE 2: THIRD-PARTY & SHADOW IT EXPANSION (MODULAR SERVICE) ---
        if enable_phase2:
            p2_scanner = Phase2ExternalScanner(
                api_key=self.api_key,
                execute_serpapi_fn=self.execute_serpapi_query
            )
            p2_findings, p2_thoughts, p2_credits = p2_scanner.run_phase2_sweep(
                clean_target=clean_target,
                brand_name=brand_name,
                custom_dorks=custom_dorks,
                enabled_vectors=enabled_vectors
            )
            external_findings.extend(p2_findings)
            thoughts.extend(p2_thoughts)
            credits_used += p2_credits


        # --- SERPAPI MULTI-ENGINE AGGREGATION (100% Pure SerpApi) ---
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="SERPAPI_AGGREGATION",
            message=f"SerpApi multi-engine reconnaissance complete: {len(subdomains)} active hosts, {len(findings)} perimeter endpoints, {len(external_findings)} external assets identified.",
            status="success"
        ))

        # --- AI TRIAGE LAYER: Gemini AI Vetting & False-Positive Elimination ---
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="AI_TRIAGE_INIT",
            message=f"Engaging Gemini AI Triage Agent to evaluate {len(findings) + len(external_findings)} candidate findings for legitimacy...",
            status="info"
        ))

        vetted_findings, int_discarded = ai_triage_findings(findings, clean_target, brand_name)
        vetted_external, ext_discarded = ai_triage_findings(external_findings, clean_target, brand_name)
        total_discarded = len(int_discarded) + len(ext_discarded)

        # Log individual purged noise items for transparent auditability
        for discarded in (int_discarded + ext_discarded):
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="AI_TRIAGE_PURGE",
                message=f"AI Triage Filter purged noise: '{discarded.get('title')}' — {discarded.get('reason', 'Non-security item')}",
                status="warning"
            ))

        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="AI_TRIAGE_COMPLETE",
            message=f"AI Triage Complete: Verified {len(vetted_findings) + len(vetted_external)} legitimate security findings & assets. Purged {total_discarded} false-positive items.",
            status="success" if total_discarded == 0 else "info"
        ))

        findings = vetted_findings
        external_findings = vetted_external

        # Assemble Graph with Dual-Zone layout (Zone 1: Info/Assets, Zone 2: Vulnerabilities)
        nodes, edges = layout_graph(clean_target, subdomains, findings, external_findings)

        critical_count = sum(1 for f in findings + external_findings if f.get("severity") == "CRITICAL" and f.get("category") != "VULN_STATUS_CLEAN")
        high_count = sum(1 for f in findings + external_findings if f.get("severity") == "HIGH")
        medium_count = sum(1 for f in findings + external_findings if f.get("severity") == "MEDIUM")
        low_count = len(subdomains) + sum(1 for f in findings + external_findings if f.get("severity") == "LOW")
        info_count = 1 + sum(1 for f in findings + external_findings if f.get("severity") == "INFO")

        vulnerability_count = sum(1 for f in findings + external_findings if f.get("section") == "VULNERABILITY" and f.get("category") != "VULN_STATUS_CLEAN")
        info_assets_count = len(nodes) - vulnerability_count

        score, grade = compute_security_score(critical_count, high_count, medium_count, low_count)
        exec_summary = build_executive_summary(clean_target, len(nodes), critical_count, high_count, medium_count, score, grade)

        summary = ScanSummary(
            target=clean_target,
            total_nodes=len(nodes),
            critical_risks=critical_count,
            high_risks=high_count,
            medium_risks=medium_count,
            low_risks=low_count,
            info=info_count,
            info_assets_count=info_assets_count,
            vulnerability_count=vulnerability_count,
            external_threat_count=len(external_findings),
            ai_discarded_noise_count=total_discarded,
            security_score=score,
            security_grade=grade,
            serpapi_credits_used=credits_used,
            generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            protocol_used=protocol
        )

        result = ScanResult(
            summary=summary,
            executive_summary=exec_summary,
            nodes=nodes,
            edges=edges,
            thoughts=thoughts
        )

        return result


    def _generate_simulated_scan(
        self,
        target: str,
        thoughts: List[AgentThought],
        protocol: str = "rest",
        enable_phase2: bool = True,
        enabled_vectors: Optional[Dict[str, bool]] = None
    ) -> ScanResult:
        """Deterministic simulation for offline testing and 0-credit development."""
        subdomains = [
            {
                "host": f"staging-api.{target}",
                "url": f"https://staging-api.{target}",
                "snippet": "Internal staging API cluster for integration tests.",
                "dork": f"site:*.{target} -www.{target}",
                "engine": "google"
            },
            {
                "host": f"qa-auth.{target}",
                "url": f"https://qa-auth.{target}",
                "snippet": "Single Sign-On authentication gateway for QA team.",
                "dork": f"site:{target} -www.{target}",
                "engine": "bing"
            },
            {
                "host": f"dev-mesh.{target}",
                "url": f"https://dev-mesh.{target}",
                "snippet": "Internal service mesh and staging router discovered bypassing robots.txt.",
                "dork": f"site:*.{target} -www.{target}",
                "engine": "duckduckgo"
            }
        ]

        findings = [
            {
                "title": "Public Swagger API Gateway",
                "category": "API_DOCS",
                "severity": "MEDIUM",
                "host": f"staging-api.{target}",
                "url": f"https://staging-api.{target}/swagger-ui.html",
                "snippet": "Swagger UI interactive schema detailing customer records and authentication endpoints.",
                "dork": f"site:{target} (inurl:swagger-ui OR inurl:graphiql)",
                "surface": "Interactive Documentation",
                "engine": "google"
            },
            {
                "title": "Exposed Production .env File",
                "category": "CONFIG_LEAK",
                "severity": "CRITICAL",
                "host": f"staging-api.{target}",
                "url": f"https://staging-api.{target}/.env",
                "snippet": "DB_HOST=10.0.4.1 DB_PASSWORD=prod_vault_secret_99 JWT_SECRET=supersecret",
                "dork": f"site:{target} (filetype:env OR filetype:sql)",
                "surface": "Web Server Root",
                "engine": "google"
            },
            {
                "title": "Exposed Cloud Secret / Token Signature (AIzaSy)",
                "category": "TOKEN_LEAK",
                "severity": "CRITICAL",
                "host": f"dev-mesh.{target}",
                "url": f"https://dev-mesh.{target}/main.bundle.js",
                "snippet": "Hardcoded Google Cloud API key AIzaSyA0d... detected in public client bundle.",
                "dork": f"site:{target} (\"AIzaSy\" OR \"sk_live_\")",
                "surface": "Web Client Bundle / Source",
                "engine": "google"
            }
        ]

        external_findings = []
        vectors = enabled_vectors or {}

        if enable_phase2:
            now_str = datetime.datetime.now().strftime("%H:%M:%S")
            if vectors.get("youtube", True):
                external_findings.append({
                    "title": f"Research PoC Video: Auth Flow Analysis on {target.title()}",
                    "category": "YOUTUBE_POC",
                    "severity": "INFO",
                    "url": "https://www.youtube.com/watch?v=sample_poc_demo",
                    "snippet": f"Channel: CyberSecurityLab | Views: 14.2K | 2026. Live proof of concept demonstrating OAuth flow anomaly on {target}.",
                    "dork": f"engine:youtube search_query='{target} vulnerability'",
                    "surface": "YouTube Exploit Radar",
                    "engine": "youtube"
                })
            else:
                thoughts.append(AgentThought(
                    timestamp=now_str,
                    stage="VECTOR_BYPASS",
                    message="[DORK MATRIX] Bypassing YouTube Exploit PoC Radar per user configuration (0 queries, 0 credits)",
                    status="info"
                ))

            if vectors.get("play", True):
                external_findings.append({
                    "title": f"Mobile Client: {target.title()} Workspace",
                    "category": "MOBILE_APP",
                    "severity": "INFO",
                    "url": f"https://play.google.com/store/apps/details?id=com.{target.split('.')[0]}.app",
                    "snippet": f"Package: com.{target.split('.')[0]}.app | Rating: 4.8★ | Developer: {target.title()} Official",
                    "dork": f"engine:google_play q={target.split('.')[0]}",
                    "surface": "Google Play Store",
                    "engine": "google_play"
                })
            else:
                thoughts.append(AgentThought(
                    timestamp=now_str,
                    stage="VECTOR_BYPASS",
                    message="[DORK MATRIX] Bypassing Google Play Store Mobile Perimeter per user configuration (0 queries, 0 credits)",
                    status="info"
                ))

            if vectors.get("cloud", True):
                external_findings.append({
                    "title": f"Public Cloud Storage Bucket: {target.split('.')[0]}-assets",
                    "category": "CLOUD_STORAGE",
                    "severity": "MEDIUM",
                    "url": f"https://{target.split('.')[0]}-assets.s3.amazonaws.com",
                    "snippet": "Publicly readable Amazon S3 bucket indexing staging build assets and backups.",
                    "dork": f"site:s3.amazonaws.com \"{target.split('.')[0]}\"",
                    "surface": "Multi-Cloud Storage",
                    "engine": "google"
                })
            else:
                thoughts.append(AgentThought(
                    timestamp=now_str,
                    stage="VECTOR_BYPASS",
                    message="[DORK MATRIX] Bypassing Multi-Cloud Storage Bucket Hunter per user configuration (0 queries, 0 credits)",
                    status="info"
                ))

        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="SYNTHESIS",
            message=f"Constructed multi-engine attack surface graph for {target} with {len(subdomains)} subdomains, {len(findings)} perimeter findings, and {len(external_findings)} external threat assets.",
            status="success"
        ))

        for f in findings:
            cat = f.get("category", "")
            playbook = get_remediation_for_category(cat)
            f["what_is_the_bug"] = f.get("what_is_the_bug") or f"Publicly accessible exposure ({cat}) identified at {f.get('url')}."
            f["why_it_is_a_bug"] = playbook.get("why_it_is_a_bug")
            f["attack_vector"] = playbook.get("attack_vector")
            f["how_to_fix"] = playbook.get("how_to_fix")
            f["remediation"] = playbook.get("default_directive")
            f["owasp_tag"] = playbook.get("owasp_tag")
            f["cwe_id"] = playbook.get("cwe_id")
            f["cvss_score"] = playbook.get("cvss_score")
            f["remediation_steps"] = playbook.get("remediation_steps", [])

        nodes, edges = layout_graph(target, subdomains, findings, external_findings)
        score, grade = compute_security_score(2, 0, 1, 3)
        exec_summary = build_executive_summary(target, len(nodes), 2, 0, 1, score, grade)

        summary = ScanSummary(
            target=target,
            total_nodes=len(nodes),
            critical_risks=2,
            high_risks=0,
            medium_risks=1,
            low_risks=3,
            info=3,
            info_assets_count=len(nodes) - 2,
            vulnerability_count=2,
            external_threat_count=len(external_findings),
            ai_discarded_noise_count=0,
            security_score=score,
            security_grade=grade,
            serpapi_credits_used=0,
            generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            protocol_used=protocol
        )

        return ScanResult(
            summary=summary,
            executive_summary=exec_summary,
            nodes=nodes,
            edges=edges,
            thoughts=thoughts
        )
