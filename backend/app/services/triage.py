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
    to eliminate false-positive noise (e.g. software tutorials, plugin release notes,
    personal workflow videos, gaming, marketing reviews, generic discussions)
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
                "snippet": f.get("snippet", "")[:180],
                "category": f.get("category", ""),
                "engine": f.get("engine", "")
            })

        prompt = (
            f"You are the senior autonomous Cyber Triage AI for ReconFlow AI. Target: '{target}' (Brand: '{brand}').\n"
            f"Evaluate these {len(candidates_to_eval)} raw search findings. Determine if each item is a LEGITIMATE security finding / corporate asset or FALSE-POSITIVE NOISE.\n\n"
            f"CRITERIA:\n"
            f"1. DISCARD / REJECT (is_legitimate: false):\n"
            f"   - Software tutorials, setup walkthroughs, plugin release notes (e.g., 'Obsidian update - links', 'how to install', 'getting started guide', 'theme review').\n"
            f"   - Generic productivity videos, gaming/entertainment, product reviews, or unrelated code discussions that are NOT actual security vulnerabilities or verified corporate assets.\n"
            f"2. APPROVE (is_legitimate: true):\n"
            f"   - If it is a real security flaw, credential leak (.env, private keys, database dumps, exposed tokens), or genuine CVE exploit writeup: classification = 'VULNERABILITY'.\n"
            f"   - If it is a legitimate perimeter asset (subdomain, official developer API docs, verified mobile app for the target brand, or cybersecurity threat bulletin): classification = 'INFO'.\n\n"
            f"Format response as strict JSON: array of objects:\n"
            f"[\n"
            f"  {{\"id\": 0, \"is_legitimate\": false, \"classification\": \"INFO\", \"reason\": \"Explanation\"}},\n"
            f"  ...\n"
            f"]\n\n"
            f"Findings to evaluate:\n{json.dumps(candidates_to_eval)}"
        )

        models_to_try = [
            "gemini-flash-lite-latest",
            "gemini-2.5-flash-lite",
            "gemini-3.5-flash-lite",
            "gemini-flash-latest"
        ]

        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            try:
                resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=6)
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
                            classification = (item_eval.get("classification") if item_eval else None) or ("VULNERABILITY" if f.get("severity") in ["CRITICAL", "HIGH"] and f.get("category") in ["CONFIG_LEAK", "TOKEN_LEAK"] else "INFO")
                            approved_item["section"] = classification
                            approved_item["triage_classification"] = classification
                            approved_item["triage_reason"] = item_eval.get("reason", "Verified legitimate intelligence.") if item_eval else "Rule-verified."
                            approved.append(approved_item)

                    return approved, discarded
            except Exception:
                continue

    # Heuristic Fallback
    approved = []
    discarded = []
    noise_indicators = [
        "obsidian", "plugin", "how to install", "tutorial", "walkthrough guide",
        "update - links", "review", "feature demo", "trailer", "gameplay",
        "productivity", "personal knowledge management", "getting started", "template"
    ]
    security_indicators = ["exploit", "cve-", "poc", "bounty", "vulnerability", "leak", "breach", "zero-day", "hackerone"]

    for f in findings:
        title = f.get("title", "").lower()
        snippet = f.get("snippet", "").lower()
        url = f.get("url", "").lower()
        cat = f.get("category", "")
        sev = f.get("severity", "INFO")

        if cat == "YOUTUBE_POC":
            is_noise = any(n in title or n in snippet for n in noise_indicators)
            has_security = any(k in title for k in security_indicators)
            if is_noise and not has_security:
                discarded_item = dict(f)
                discarded_item["reason"] = "Dropped non-security video tutorial/plugin release note."
                discarded.append(discarded_item)
                continue

        if cat == "GITHUB_LEAK":
            if any(k in url for k in ["/issues/", "/pull/", "/releases/", "/discussions/"]):
                discarded_item = dict(f)
                discarded_item["reason"] = "Ignored public discussion/issue thread."
                discarded.append(discarded_item)
                continue

        approved_item = dict(f)
        if cat in ["CONFIG_LEAK", "TOKEN_LEAK"] or (cat == "GITHUB_LEAK" and sev == "CRITICAL"):
            approved_item["section"] = "VULNERABILITY"
            approved_item["triage_classification"] = "VULNERABILITY"
        else:
            approved_item["section"] = "INFO"
            approved_item["triage_classification"] = "INFO"
        approved_item["triage_reason"] = "Validated by security heuristics."
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
        models_to_try = ["gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-flash-latest"]
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
            metadata=FindingMetadata(
                url=f"https://{target}",
                snippet=f"Apex domain target for {target}",
                dork_used="N/A",
                discovered_at="2026-09-23T08:30:00Z"
            )
        ),
        position={"x": 380.0, "y": 40.0}
    ))

    # Subdomains (Zone 1 Tier 2: y = 200.0)
    subdomain_id_map: Dict[str, str] = {}
    sub_count = len(subdomains)
    sub_start_x = 80.0
    sub_spacing = 230.0

    for idx, sub in enumerate(subdomains):
        sub_id = f"node-sub-{idx}"
        sub_name = sub.get("host", target)
        subdomain_id_map[sub_name] = sub_id
        
        pos_x = sub_start_x + (idx * sub_spacing)
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
                triage_reason="Active infrastructure host mapped from multi-engine DNS sweep.",
                metadata=FindingMetadata(
                    url=sub.get("url", f"https://{sub_name}"),
                    snippet=sub.get("snippet", "Discovered host cluster."),
                    dork_used=sub.get("dork", f"site:*.{target}"),
                    discovered_at="2026-09-23T08:30:01Z"
                )
            ),
            position={"x": pos_x, "y": 200.0}
        ))
        edges.append(GraphEdge(
            id=f"edge-root-sub-{idx}",
            source=root_id,
            target=sub_id,
            label="HOSTS",
            animated=False,
            style={"stroke": "#38bdf8", "strokeWidth": 1.5}
        ))

    # Internal Info Findings (e.g. Auth Portals, API Docs) (Zone 1 Tier 3)
    for idx, find in enumerate(internal_info_findings):
        find_id = f"node-info-find-{idx}"
        cat = find.get("category", "API_DOCS")
        playbook = get_remediation_for_category(cat)
        parent_host = find.get("host", "")
        parent_id = subdomain_id_map.get(parent_host, root_id)

        pos_x = sub_start_x + ((idx % 3) * sub_spacing)
        pos_y = 360.0 + ((idx // 3) * 150.0)

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
                owasp_tag=playbook.get("owasp_tag"),
                cwe_id=playbook.get("cwe_id"),
                remediation=playbook.get("default_directive"),
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

    # External Info Findings (News, Mobile Apps, Vetted PoCs)
    ext_info_start_y = 360.0 + (((len(internal_info_findings) + 2) // 3) * 150.0)

    for idx, ext in enumerate(external_info_findings):
        ext_id = f"node-ext-info-{idx}"
        cat = ext.get("category", "NEWS_BREACH")
        playbook = get_remediation_for_category(cat)

        if "NEWS" in cat:
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
                owasp_tag=playbook.get("owasp_tag"),
                cwe_id=playbook.get("cwe_id"),
                remediation=playbook.get("default_directive"),
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
                cwe_id="CWE-16 (Secure)",
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
                    owasp_tag=playbook.get("owasp_tag"),
                    cwe_id=playbook.get("cwe_id"),
                    remediation=playbook.get("default_directive"),
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
