import requests
from typing import List, Dict, Any, Tuple
from app.config import get_gemini_api_key
from app.schemas import GraphNode, GraphEdge, ScanSummary, NodeData, FindingMetadata
from app.remediation import get_remediation_for_category

def compute_security_score(critical: int, high: int, medium: int, low: int) -> Tuple[int, str]:
    # Deductions only for real confirmed vulnerabilities:
    # Critical (Raw .env / DB dump / Private Key): -25
    # High (Sensitive backup / open corporate S3 bucket): -15
    # Medium (Exposed API swagger / unauthenticated gateway): -5
    # Low (Public SSO/Admin portal, subdomains): -1 (capped at -10 max)
    # Informational (News / Threat Intel): 0 deduction
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
    # 1. Attempt dynamic Gemini AI CISO analysis if GEMINI_API_KEY is available
    gemini_key = get_gemini_api_key()
    if gemini_key:
        prompt = (
            f"You are the CISO threat intelligence agent of ReconFlow AI. "
            f"Write a sharp, 2-3 sentence executive threat briefing for enterprise target '{target}'. "
            f"Perimeter findings: Total Assets: {total}, Critical Leaks: {critical}, High Risks: {high}, "
            f"Medium Risks: {medium}, Security Score: {score}/100, Grade: {grade}. "
            f"Tone: Professional, urgent if risks exist, authoritative."
        )
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={gemini_key}"
        try:
            resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=6)
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text:
                    return text
        except Exception:
            pass

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
        f"ReconFlow AI autonomous sweep of {target} identified {total} perimeter assets. "
        f"Security Posture Grade: {grade} (Score {score}/100) — {risk_level}. "
        f"Discovered {critical} critical and {high} high severity exposures. {recommendation}"
    )


def layout_graph(
    target: str,
    subdomains: List[Dict[str, Any]],
    findings: List[Dict[str, Any]],
    external_findings: List[Dict[str, Any]]
) -> Tuple[List[GraphNode], List[GraphEdge]]:
    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []

    # 1. Root Apex Node (Center Top)
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
            metadata=FindingMetadata(
                url=f"https://{target}",
                snippet=f"Apex domain target for {target}",
                dork_used="N/A",
                discovered_at="2026-09-23T08:30:00Z"
            )
        ),
        position={"x": 600.0, "y": 50.0}
    ))

    # 2. Subdomain Asset Nodes (Placed on the Left Wing / Center Tier: y=220)
    sub_count = len(subdomains)
    sub_start_x = 200.0 if sub_count > 1 else 350.0
    sub_spacing = 220.0

    subdomain_id_map: Dict[str, str] = {}
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
                metadata=FindingMetadata(
                    url=sub.get("url", f"https://{sub_name}"),
                    snippet=sub.get("snippet", "Discovered host cluster."),
                    dork_used=sub.get("dork", f"site:*.{target}"),
                    discovered_at="2026-09-23T08:30:01Z"
                )
            ),
            position={"x": pos_x, "y": 220.0}
        ))
        # Edge from Root to Subdomain
        edges.append(GraphEdge(
            id=f"edge-root-sub-{idx}",
            source=root_id,
            target=sub_id,
            label="HOSTS",
            animated=False
        ))

    # 3. Internal Finding Nodes (Placed below subdomains: y=420)
    find_start_x = 100.0
    find_spacing = 240.0
    for idx, find in enumerate(findings):
        find_id = f"node-find-{idx}"
        cat = find.get("category", "CONFIG_LEAK")
        playbook = get_remediation_for_category(cat)
        
        # Link to parent subdomain or root
        parent_host = find.get("host", "")
        parent_id = subdomain_id_map.get(parent_host, root_id)

        pos_x = find_start_x + (idx * find_spacing)
        is_critical = find.get("severity") == "CRITICAL"

        nodes.append(GraphNode(
            id=find_id,
            type="findingNode",
            data=NodeData(
                label=find.get("title", "Discovered Exposure"),
                category=cat,
                severity=find.get("severity", "MEDIUM"),
                origin="INTERNAL",
                surface=find.get("surface", "Web Server Root"),
                engine=find.get("engine", "google"),
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
            position={"x": pos_x, "y": 420.0}
        ))

        # Edge from Subdomain to Finding
        edges.append(GraphEdge(
            id=f"edge-find-{idx}",
            source=parent_id,
            target=find_id,
            label="EXPOSES_SECRET" if is_critical else "EXPOSES_API",
            animated=is_critical,
            style={
                "stroke": "#ef4444" if is_critical else "#f59e0b",
                "strokeWidth": 2.5 if is_critical else 2.0
            }
        ))

    # 4. External Shadow Findings (Right Wing: x > 800)
    ext_start_x = 850.0
    for idx, ext in enumerate(external_findings):
        ext_id = f"node-ext-{idx}"
        cat = ext.get("category", "GITHUB_LEAK")
        playbook = get_remediation_for_category(cat)
        is_critical = ext.get("severity") == "CRITICAL"

        nodes.append(GraphNode(
            id=ext_id,
            type="externalNode",
            data=NodeData(
                label=ext.get("title", "External Leak"),
                category=cat,
                severity=ext.get("severity", "HIGH"),
                origin="EXTERNAL",
                surface=ext.get("surface", "GitHub / S3"),
                engine=ext.get("engine", "google"),
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
            position={"x": ext_start_x + (idx * 220.0), "y": 250.0 + (idx * 150.0)}
        ))

        edges.append(GraphEdge(
            id=f"edge-ext-{idx}",
            source=root_id,
            target=ext_id,
            label="CODE_LEAK" if "GITHUB" in cat else "CLOUD_STORAGE",
            animated=is_critical,
            style={
                "stroke": "#dc2626" if is_critical else "#f97316",
                "strokeWidth": 2.0,
                "strokeDasharray": "5 5"
            }
        ))

    return nodes, edges
