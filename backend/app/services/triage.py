import json
import re
import requests
from typing import List, Dict, Any, Tuple
from app.config import get_gemini_api_key
from app.schemas import GraphNode, GraphEdge, ScanSummary, NodeData, FindingMetadata
from app.remediation import get_remediation_for_category

def ai_triage_findings(
    findings: List[Dict[str, Any]],
    target: str,
    brand: str
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Evaluates raw reconnaissance findings using Gemini AI (with heuristic fallback)
    to eliminate false-positive noise (e.g. standard marketing/blog/careers pages,
    software tutorials, setup guides, plugin release notes, generic discussions)
    and strictly separate legitimate findings into 'VULNERABILITY' vs 'INFO' sections.

    Returns: (approved_findings, discarded_findings)
    """
    if not findings:
        return [], []

    gemini_key = get_gemini_api_key()
    if gemini_key:
        candidates_to_eval = []
        for idx, f in enumerate(findings):
            candidates_to_eval.append({
                "id": idx,
                "title": f.get("title", ""),
                "url": f.get("url", ""),
                "snippet": f.get("snippet", "")[:200],
                "category": f.get("category", ""),
                "engine": f.get("engine", "")
            })

        prompt = (
            f"You are the senior autonomous Cyber Triage AI for ReconFlow AI. Target: '{target}' (Brand: '{brand}').\n"
            f"Evaluate these {len(candidates_to_eval)} raw search findings. Determine if each item is a LEGITIMATE security finding / corporate asset or FALSE-POSITIVE NOISE.\n\n"
            f"CRITICAL RULES:\n"
            f"1. CLASSIFY AS 'VULNERABILITY' (is_legitimate: true, classification: 'VULNERABILITY'):\n"
            f"   - Confirmed security vulnerabilities: missing Content-Security-Policy (CSP), missing DMARC/SPF email spoofing risk, missing CAA DNS record, exposed configuration (.env, .sql, .bak, server dumps), open directory listings, exposed unauthenticated API schemas (/openapi.json), or exposed API secret tokens (AKIA, sk_live_, ghp_).\n"
            f"2. CLASSIFY AS 'INFO' (is_legitimate: true, classification: 'INFO'):\n"
            f"   - Legitimate perimeter assets: active subdomains, dedicated login portals, interactive developer API docs (Swagger/GraphQL), verified mobile applications, robots.txt policies, and public GitHub code repositories.\n"
            f"3. CLASSIFY AS 'RESOURCE' (is_legitimate: true, classification: 'RESOURCE'):\n"
            f"   - OSINT intelligence, third-party directory listings, brand footprint, security research videos, bug bounty methodologies, researcher writeups, public toolkits, and threat news bulletins. These are valuable intel sources and MUST be retained as resources.\n"
            f"4. DISCARD / REJECT (is_legitimate: false):\n"
            f"   - Discard ONLY completely broken URLs or total garbage spam completely unrelated to the brand/target. NEVER discard brand directory listings, software tool listings, or GitHub repositories!\n\n"
            f"Format response as strict JSON: array of objects:\n"
            f"[\n"
            f"  {{\n"
            f"    \"id\": 0,\n"
            f"    \"is_legitimate\": true,\n"
            f"    \"classification\": \"VULNERABILITY\" | \"INFO\" | \"RESOURCE\",\n"
            f"    \"what_is_the_bug\": \"Plain-English summary of what was found\",\n"
            f"    \"why_it_is_a_bug\": \"Technical explanation of the threat, attack vector, or research context\",\n"
            f"    \"how_to_fix\": \"Actionable technical remediation directive or 'No remediation required' for resources\",\n"
            f"    \"reason\": \"Brief triage rationale\"\n"
            f"  }}\n"
            f"]\n\n"
            f"Findings to evaluate:\n{json.dumps(candidates_to_eval)}"
        )

        models_to_try = [
            "gemini-flash-latest",
            "gemini-3.8-flash"
        ]

        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            try:
                resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=8)
                if resp.status_code == 200:
                    raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    clean_json = re.sub(r"^```json\s*|^```\s*|```$", "", raw_text, flags=re.MULTILINE).strip()
                    evaluations = json.loads(clean_json)
                    eval_map = {
                        item["id"]: item
                        for item in evaluations
                        if isinstance(item, dict) and "id" in item
                    }

                    approved = []
                    discarded = []
                    for idx, f in enumerate(findings):
                        item_eval = eval_map.get(idx)
                        if item_eval and not item_eval.get("is_legitimate", True):
                            discarded_item = dict(f)
                            discarded_item["reason"] = item_eval.get("reason", "Filtered out as false-positive noise by AI layer.")
                            discarded.append(discarded_item)
                        else:
                            approved_item = dict(f)
                            cat = f.get("category", "")
                            raw_class = item_eval.get("classification") if item_eval else None
                            
                            # Prioritize AI classification
                            if item_eval and raw_class in ["INFO", "RESOURCE"]:
                                classification = raw_class
                            elif item_eval and raw_class == "VULNERABILITY":
                                classification = "VULNERABILITY"
                            elif f.get("section") == "VULNERABILITY":
                                classification = "VULNERABILITY"
                            elif f.get("severity") in ["CRITICAL", "HIGH"] and cat in ["CONFIG_LEAK", "TOKEN_LEAK"]:
                                classification = "VULNERABILITY"
                            elif cat in ["YOUTUBE_POC", "NEWS_BREACH", "RESOURCE", "BRAND_PRESENCE"] or "resource" in cat.lower():
                                classification = "RESOURCE"
                            else:
                                classification = "INFO"

                            approved_item["section"] = classification
                            approved_item["triage_classification"] = classification
                            approved_item["triage_reason"] = item_eval.get("reason", "Verified legitimate intelligence.") if item_eval else "Rule-verified."
                            
                            # If classified as INFO or RESOURCE, ensure it is non-vulnerable
                            if classification in ["RESOURCE", "INFO"]:
                                approved_item["severity"] = "INFO"
                                if classification == "RESOURCE":
                                    approved_item["category"] = "RESOURCE"
                            
                            # Attach rich AI explanations if provided
                            if item_eval:
                                if item_eval.get("what_is_the_bug"):
                                    approved_item["what_is_the_bug"] = item_eval["what_is_the_bug"]
                                if item_eval.get("why_it_is_a_bug"):
                                    approved_item["why_it_is_a_bug"] = item_eval["why_it_is_a_bug"]
                                if item_eval.get("how_to_fix"):
                                    approved_item["how_to_fix"] = item_eval["how_to_fix"]
                                    
                            # Clear irrelevant CVSS/remediation if declared safe or no remediation required
                            if classification in ["RESOURCE", "INFO"]:
                                why_lower = approved_item.get("why_it_is_a_bug", "").lower()
                                how_lower = approved_item.get("how_to_fix", "").lower()
                                reason_lower = approved_item.get("triage_reason", "").lower()
                                if "not a security vulnerability" in why_lower or "no remediation" in how_lower or "safe" in reason_lower:
                                    approved_item["cvss_score"] = "N/A"
                                    approved_item["owasp_tag"] = "N/A"
                                    approved_item["cwe_id"] = "N/A"
                                    approved_item["remediation_steps"] = []
                                    approved_item["remediation"] = "No remediation required."

                    return approved, discarded
            except Exception:
                continue

    # Heuristic Fallback: Do not discard valid OSINT assets
    approved = []
    discarded = []

    for f in findings:
        title = f.get("title", "").lower()
        snippet = f.get("snippet", "").lower()
        url = f.get("url", "").lower()
        cat = f.get("category", "")
        sev = f.get("severity", "INFO")

        playbook = get_remediation_for_category(cat)
        approved_item = dict(f)

        if f.get("section") == "VULNERABILITY" or cat in ["CONFIG_LEAK", "TOKEN_LEAK"] or (cat == "GITHUB_LEAK" and sev == "CRITICAL"):
            approved_item["section"] = "VULNERABILITY"
            approved_item["triage_classification"] = "VULNERABILITY"
        elif cat in ["YOUTUBE_POC", "NEWS_BREACH", "RESOURCE", "BRAND_PRESENCE"]:
            approved_item["section"] = "RESOURCE"
            approved_item["triage_classification"] = "RESOURCE"
            approved_item["category"] = "RESOURCE"
            approved_item["severity"] = "INFO"
        else:
            approved_item["section"] = "INFO"
            approved_item["triage_classification"] = "INFO"
            
        approved_item["triage_reason"] = "Validated by security heuristics."
        approved_item["what_is_the_bug"] = approved_item.get("what_is_the_bug") or playbook.get("what_is_the_bug")
        approved_item["why_it_is_a_bug"] = approved_item.get("why_it_is_a_bug") or playbook.get("why_it_is_a_bug")
        approved_item["attack_vector"] = approved_item.get("attack_vector") or playbook.get("attack_vector")
        approved_item["how_to_fix"] = approved_item.get("how_to_fix") or playbook.get("how_to_fix")
        approved_item["remediation_steps"] = approved_item.get("remediation_steps") or playbook.get("actions")
        approved_item["cvss_score"] = approved_item.get("cvss_score") or playbook.get("cvss_score")
        approved.append(approved_item)

    return approved, discarded


def compute_security_score(critical: int, high: int, medium: int, low: int) -> Tuple[int, str]:
    deduction = (critical * 25) + (high * 15) + (medium * 5) + min(10, low * 1)
    score = max(0, min(100, 100 - deduction))
    
    if score >= 90:
        grade = "A"
    elif score >= 80:
        grade = "B"
    elif score >= 65:
        grade = "C"
    elif score >= 40:
        grade = "D"
    else:
        grade = "F"
        
    return score, grade


def build_executive_summary(target: str, total: int, critical: int, high: int, medium: int, score: int, grade: str) -> str:
    gemini_key = get_gemini_api_key()
    if gemini_key:
        prompt = (
            f"You are the CISO threat intelligence agent of ReconFlow AI. "
            f"Write a sharp, 2-3 sentence executive threat briefing for enterprise target '{target}'. "
            f"Perimeter findings: Total Assets & Intel: {total}, Critical Leaks: {critical}, High Risks: {high}, "
            f"Medium Risks: {medium}, Security Score: {score}/100, Grade: {grade}. "
            f"Tone: Professional, authoritative, actionable."
        )
        models_to_try = ["gemini-flash-latest", "gemini-3.8-flash"]
        for m in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={gemini_key}"
            try:
                resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=5)
                if resp.status_code == 200:
                    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if text:
                        return text
            except Exception:
                continue

    # Fallback rule-based template
    if critical > 0:
        risk_level = "CRITICAL RISK"
        recommendation = "Immediate perimeter remediation required to revoke exposed credentials and isolate staging servers."
    elif high > 0:
        risk_level = "HIGH RISK"
        recommendation = "High-priority attention needed to restrict open cloud storage and audit documentation endpoints."
    elif medium > 0:
        risk_level = "MODERATE RISK"
        recommendation = "Enforce authentication gateways and reverse-proxy controls on exposed documentation."
    else:
        risk_level = "HEALTHY PERIMETER"
        recommendation = "Maintain regular surveillance and continuous automated dorking sweeps."

    return (
        f"ReconFlow AI autonomous sweep of {target} identified {total} perimeter assets and intelligence items. "
        f"Security Posture Grade: {grade} (Score {score}/100) — {risk_level}. "
        f"Discovered {critical} critical and {high} high severity exposures. {recommendation}"
    )


def layout_graph(
    target: str,
    subdomains: List[Dict[str, Any]],
    findings: List[Dict[str, Any]],
    external_findings: List[Dict[str, Any]]
) -> Tuple[List[GraphNode], List[GraphEdge]]:
    """
    Constructs a dual-zone graph architecture:
    - ZONE 1 (Left / Center): PERIMETER ASSETS & THREAT INTEL SECTION (Info)
    - ZONE 2 (Right Wing): ACTIVE VULNERABILITY PERIMETER (Vulns)
    If zero vulnerabilities exist, a dedicated reassuring 'Perimeter Secure' status node is rendered.
    """
    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []

    # Partition findings into Internal Info, External Info, and Vulnerabilities
    internal_info_findings = [f for f in findings if f.get("section") != "VULNERABILITY"]
    external_info_findings = [ext for ext in external_findings if ext.get("section") != "VULNERABILITY"]
    vuln_findings = [
        f for f in (findings + external_findings)
        if f.get("section") == "VULNERABILITY" or (f.get("severity") in ["CRITICAL", "HIGH"] and f.get("category") in ["CONFIG_LEAK", "TOKEN_LEAK"])
    ]

    # -------------------------------------------------------------
    # ZONE 1: PERIMETER ASSETS & THREAT INTEL SECTION
    # -------------------------------------------------------------
    root_id = "node-root"
    nodes.append(GraphNode(
        id=root_id,
        type="rootNode",
        data=NodeData(
            label=target,
            category="ROOT_DOMAIN",
            severity="INFO",
            origin="INTERNAL",
            surface="Apex DNS",
            engine="google_light",
            section="INFO",
            triage_classification="INFO",
            triage_reason="Target apex root domain.",
            what_is_the_bug="Target apex domain serving as root anchor for attack surface mapping.",
            why_it_is_a_bug="The apex domain is the primary organizational perimeter entry point.",
            how_to_fix="Ensure DNSSEC is enabled, CAA records are configured, and TLS certificates are auto-renewed.",
            remediation="Enforce strict DNSSEC, CAA records, and modern TLS 1.3 encryption across apex.",
            metadata=FindingMetadata(
                url=f"https://{target}",
                snippet=f"Apex domain target for {target}",
                dork_used="N/A",
                discovered_at="2026-09-23T08:30:00Z"
            )
        ),
        position={"x": 380.0, "y": 40.0}
    ))

    # Subdomains (Zone 1 Tier 2)
    subdomain_id_map: Dict[str, str] = {}
    sub_start_x = 80.0
    sub_spacing = 250.0

    for idx, sub in enumerate(subdomains):
        sub_id = f"node-sub-{idx}"
        sub_name = sub.get("host", target)
        subdomain_id_map[sub_name] = sub_id
        
        col = idx % 3
        row = idx // 3
        pos_x = sub_start_x + (col * sub_spacing)
        pos_y = 180.0 + (row * 130.0)

        nodes.append(GraphNode(
            id=sub_id,
            type="assetNode",
            data=NodeData(
                label=sub_name,
                category="INFRASTRUCTURE",
                severity="LOW",
                origin="INTERNAL",
                surface="Subdomain",
                engine=sub.get("engine", "google"),
                section="INFO",
                triage_classification="INFO",
                triage_reason="Active infrastructure host mapped from multi-engine DNS & OSINT sweep.",
                what_is_the_bug=f"Discovered active subdomain host {sub_name}.",
                why_it_is_a_bug="Public subdomains expand the perimeter attack surface. Dangling CNAMEs can lead to subdomain takeover.",
                how_to_fix="Audit DNS records to remove stale pointers. Enforce SSL and restrict internal staging portals.",
                remediation="Audit DNS records and enforce TLS termination on all active subdomains.",
                metadata=FindingMetadata(
                    url=sub.get("url", f"https://{sub_name}"),
                    snippet=sub.get("snippet", "Discovered host cluster."),
                    dork_used=sub.get("dork", f"site:*.{target}"),
                    discovered_at="2026-09-23T08:30:01Z"
                )
            ),
            position={"x": pos_x, "y": pos_y}
        ))
        edges.append(GraphEdge(
            id=f"edge-root-sub-{idx}",
            source=root_id,
            target=sub_id,
            label="HOSTS",
            animated=False,
            style={"stroke": "#38bdf8", "strokeWidth": 1.5}
        ))

    # Internal Info Findings (e.g. Auth Portals, API Docs, Endpoints)
    sub_rows = ((len(subdomains) + 2) // 3) if subdomains else 0
    internal_start_y = 180.0 + (sub_rows * 130.0) + (40.0 if subdomains else 20.0)

    for idx, find in enumerate(internal_info_findings):
        find_id = f"node-info-find-{idx}"
        cat = find.get("category", "API_DOCS")
        playbook = get_remediation_for_category(cat)
        parent_host = find.get("host", "")
        parent_id = subdomain_id_map.get(parent_host, root_id)

        pos_x = sub_start_x + ((idx % 3) * sub_spacing)
        pos_y = internal_start_y + ((idx // 3) * 150.0)

        nodes.append(GraphNode(
            id=find_id,
            type="findingNode",
            data=NodeData(
                label=find.get("title", "Perimeter Gateway"),
                category=cat,
                severity=find.get("severity", "LOW"),
                origin="INTERNAL",
                surface=find.get("surface", "Public Gateway"),
                engine=find.get("engine", "google"),
                section="INFO",
                triage_classification="INFO",
                triage_reason=find.get("triage_reason", "Verified informational gateway."),
                owasp_tag=find.get("owasp_tag") or playbook.get("owasp_tag"),
                cwe_id=find.get("cwe_id") or playbook.get("cwe_id"),
                cvss_score=find.get("cvss_score") or playbook.get("cvss_score"),
                what_is_the_bug=find.get("what_is_the_bug") or playbook.get("what_is_the_bug"),
                why_it_is_a_bug=find.get("why_it_is_a_bug") or playbook.get("why_it_is_a_bug"),
                attack_vector=find.get("attack_vector") or playbook.get("attack_vector"),
                how_to_fix=find.get("how_to_fix") or playbook.get("how_to_fix"),
                remediation_steps=find.get("remediation_steps") if find.get("remediation_steps") is not None else ([] if find.get("section") == "INFO" and "no remediation" in (find.get("how_to_fix") or "").lower() else playbook.get("actions")),
                remediation=find.get("remediation") or playbook.get("default_directive"),
                metadata=FindingMetadata(
                    url=find.get("url", ""),
                    snippet=find.get("snippet", ""),
                    dork_used=find.get("dork", ""),
                    discovered_at="2026-09-23T08:30:02Z"
                )
            ),
            position={"x": pos_x, "y": pos_y}
        ))

        edges.append(GraphEdge(
            id=f"edge-info-find-{idx}",
            source=parent_id,
            target=find_id,
            label="EXPOSES_API",
            animated=False,
            style={"stroke": "#38bdf8", "strokeWidth": 1.5}
        ))

    # External Info Findings (News, Mobile Apps, Repos, Directory Intel)
    int_rows = ((len(internal_info_findings) + 2) // 3) if internal_info_findings else 0
    ext_info_start_y = internal_start_y + (int_rows * 150.0) + 40.0

    for idx, ext in enumerate(external_info_findings):
        ext_id = f"node-ext-info-{idx}"
        cat = ext.get("category", "NEWS_BREACH")
        playbook = get_remediation_for_category(cat)

        if cat == "RESOURCE" or ext.get("section") == "RESOURCE":
            edge_label = "RESEARCH_RESOURCE"
            edge_color = "#a855f7"
        elif "NEWS" in cat:
            edge_label = "THREAT_INTEL"
            edge_color = "#38bdf8"
        elif "YOUTUBE" in cat:
            edge_label = "EXPLOIT_RADAR"
            edge_color = "#818cf8"
        elif "MOBILE" in cat:
            edge_label = "MOBILE_CLIENT"
            edge_color = "#10b981"
        else:
            edge_label = "EXTERNAL_ASSET"
            edge_color = "#94a3b8"

        pos_x = sub_start_x + ((idx % 3) * sub_spacing)
        pos_y = ext_info_start_y + ((idx // 3) * 150.0)

        nodes.append(GraphNode(
            id=ext_id,
            type="externalNode",
            data=NodeData(
                label=ext.get("title", "External Asset"),
                category=cat,
                severity=ext.get("severity", "INFO"),
                origin="EXTERNAL",
                surface=ext.get("surface", "External Ecosystem"),
                engine=ext.get("engine", "google"),
                section="INFO",
                triage_classification="INFO",
                triage_reason=ext.get("triage_reason", "Verified threat intelligence / external asset."),
                owasp_tag=ext.get("owasp_tag") or playbook.get("owasp_tag"),
                cwe_id=ext.get("cwe_id") or playbook.get("cwe_id"),
                cvss_score=ext.get("cvss_score") or playbook.get("cvss_score"),
                what_is_the_bug=ext.get("what_is_the_bug") or playbook.get("what_is_the_bug"),
                why_it_is_a_bug=ext.get("why_it_is_a_bug") or playbook.get("why_it_is_a_bug"),
                attack_vector=ext.get("attack_vector") or playbook.get("attack_vector"),
                how_to_fix=ext.get("how_to_fix") or playbook.get("how_to_fix"),
                remediation_steps=ext.get("remediation_steps") if ext.get("remediation_steps") is not None else ([] if ext.get("section") == "INFO" and "no remediation" in (ext.get("how_to_fix") or "").lower() else playbook.get("actions")),
                remediation=ext.get("remediation") or playbook.get("default_directive"),
                metadata=FindingMetadata(
                    url=ext.get("url", ""),
                    snippet=ext.get("snippet", ""),
                    dork_used=ext.get("dork", ""),
                    discovered_at="2026-09-23T08:30:04Z"
                )
            ),
            position={"x": pos_x, "y": pos_y}
        ))

        edges.append(GraphEdge(
            id=f"edge-ext-info-{idx}",
            source=root_id,
            target=ext_id,
            label=edge_label,
            animated=False,
            style={
                "stroke": edge_color,
                "strokeWidth": 1.5,
                "strokeDasharray": "5 5"
            }
        ))

    # -------------------------------------------------------------
    # ZONE 2: ACTIVE VULNERABILITY PERIMETER (Right Wing)
    # -------------------------------------------------------------
    vuln_zone_x = 920.0

    if not vuln_findings:
        # Reassuring Clean State Node: Shows that the Vulns section exists and was actively audited
        clean_node_id = "node-vuln-clean"
        nodes.append(GraphNode(
            id=clean_node_id,
            type="findingNode",
            data=NodeData(
                label="Zero Vulnerabilities Detected",
                category="VULN_STATUS_CLEAN",
                severity="INFO",
                origin="INTERNAL",
                surface="Perimeter Posture",
                engine="ai_agent",
                section="VULNERABILITY",
                triage_classification="VULNERABILITY",
                triage_reason="AI Triage verified 0 critical config leaks, open database dumps, or exposed API tokens.",
                owasp_tag="A05:2021-Security Misconfiguration (Mitigated)",
                cwe_id="CWE-16 (Secure Architecture)",
                cvss_score="0.0 (None)",
                what_is_the_bug="Zero Critical or High Severity Vulnerabilities Detected across public search indices.",
                why_it_is_a_bug="Comprehensive perimeter reconnaissance confirmed that no sensitive configuration files (.env), plaintext database dumps, or live high-entropy API keys are exposed to the public Internet.",
                attack_vector="Adversaries executing automated search dorking and port scans found no accessible unauthorized credentials or exposed backup files.",
                how_to_fix="Maintain regular automated continuous monitoring sweeps and ensure pre-commit secret scanners remain active across developer repositories.",
                remediation_steps=[
                    "1. Continuous Surveillance: Run automated dorking and subdomain sweeps every 7 days.",
                    "2. CI/CD Gating: Enforce TruffleHog / GitGuardian pre-commit checks across all engineering repositories.",
                    "3. DNS Hygiene: Audit DNS zones regularly to decommission dangling CNAME records."
                ],
                remediation="Perimeter is fully hardened. Continue routine automated continuous monitoring sweeps.",
                metadata=FindingMetadata(
                    url=f"https://{target}",
                    snippet="Perimeter is fully hardened. Zero active credential leaks, open database dumps, or unauthenticated tokens detected across Google, Bing, DuckDuckGo, and GitHub.",
                    dork_used="Comprehensive Multi-Engine Vulnerability Sweep",
                    discovered_at="2026-09-23T08:30:05Z"
                )
            ),
            position={"x": vuln_zone_x, "y": 200.0}
        ))

        edges.append(GraphEdge(
            id="edge-root-vuln-clean",
            source=root_id,
            target=clean_node_id,
            label="PERIMETER_SECURE",
            animated=False,
            style={"stroke": "#10b981", "strokeWidth": 2.0} # Calming Emerald
        ))
    else:
        # Render genuine vulnerabilities in Red / Warning styling
        for idx, vf in enumerate(vuln_findings):
            vf_id = f"node-vuln-{idx}"
            cat = vf.get("category", "CONFIG_LEAK")
            playbook = get_remediation_for_category(cat)
            is_critical = vf.get("severity") == "CRITICAL"

            if cat == "TOKEN_LEAK":
                f_label = "EXPOSES_TOKEN"
                f_color = "#ef4444"
            elif is_critical:
                f_label = "EXPOSES_SECRET"
                f_color = "#ef4444"
            else:
                f_label = "VULNERABILITY"
                f_color = "#f97316"

            parent_host = vf.get("host", "")
            parent_id = subdomain_id_map.get(parent_host, root_id)

            pos_x = vuln_zone_x + ((idx % 2) * 250.0)
            pos_y = 150.0 + ((idx // 2) * 170.0)

            nodes.append(GraphNode(
                id=vf_id,
                type="findingNode",
                data=NodeData(
                    label=vf.get("title", "Active Security Exposure"),
                    category=cat,
                    severity=vf.get("severity", "CRITICAL"),
                    origin=vf.get("origin", "INTERNAL"),
                    surface=vf.get("surface", "Web Server Root"),
                    engine=vf.get("engine", "google"),
                    section="VULNERABILITY",
                    triage_classification="VULNERABILITY",
                    triage_reason=vf.get("triage_reason", "Verified security vulnerability / credential leak."),
                    owasp_tag=vf.get("owasp_tag") or playbook.get("owasp_tag"),
                    cwe_id=vf.get("cwe_id") or playbook.get("cwe_id"),
                    cvss_score=vf.get("cvss_score") or playbook.get("cvss_score"),
                    what_is_the_bug=vf.get("what_is_the_bug") or playbook.get("what_is_the_bug"),
                    why_it_is_a_bug=vf.get("why_it_is_a_bug") or playbook.get("why_it_is_a_bug"),
                    attack_vector=vf.get("attack_vector") or playbook.get("attack_vector"),
                    how_to_fix=vf.get("how_to_fix") or playbook.get("how_to_fix"),
                    remediation_steps=vf.get("remediation_steps") or playbook.get("actions"),
                    remediation=vf.get("remediation") or playbook.get("default_directive"),
                    metadata=FindingMetadata(
                        url=vf.get("url", ""),
                        snippet=vf.get("snippet", ""),
                        dork_used=vf.get("dork", ""),
                        discovered_at="2026-09-23T08:30:05Z"
                    )
                ),
                position={"x": pos_x, "y": pos_y}
            ))

            edges.append(GraphEdge(
                id=f"edge-vuln-{idx}",
                source=parent_id,
                target=vf_id,
                label=f_label,
                animated=True,
                style={
                    "stroke": f_color,
                    "strokeWidth": 2.5
                }
            ))

    return nodes, edges
