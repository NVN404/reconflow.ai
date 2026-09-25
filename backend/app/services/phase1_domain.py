import re
import datetime
from urllib.parse import urlparse
from typing import List, Dict, Any, Tuple, Optional
import requests


from app.config import SERPAPI_KEY, get_serpapi_key
from app.cache import get_cached_scan, set_cached_scan
from app.schemas import ScanResult, ScanSummary, AgentThought
from app.services.triage import compute_security_score, build_executive_summary, layout_graph, ai_triage_findings
from app.remediation import get_remediation_for_category
from app.services.osint_scanner import (
    audit_dns_and_email_security,
    probe_live_subdomains,
    audit_http_surface_and_headers
)

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

    @property
    def api_key(self) -> str:
        return self._api_key or get_serpapi_key()

    def execute_serpapi_query(self, query: str, engine: str = "google") -> Tuple[List[Dict[str, Any]], Optional[str]]:
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

    def scan(self, target: str, use_cache: bool = True, enable_phase2: bool = False) -> ScanResult:
        clean_target = target.strip().lower()
        clean_target = re.sub(r"^https?://", "", clean_target).rstrip("/")
        brand_name = clean_target.split(".")[0]
        
        thoughts: List[AgentThought] = []
        now = datetime.datetime.now().strftime("%H:%M:%S")

        thoughts.append(AgentThought(
            timestamp=now,
            stage="INITIALIZATION",
            message=f"ReconFlow Agent armed for target: {clean_target} (Phase 2: {'ON' if enable_phase2 else 'OFF'})",
            status="info"
        ))

        # If live scan is triggered without an API key, notify agent
        if not self.api_key:
            thoughts.append(AgentThought(
                timestamp=now,
                stage="DEV_MODE",
                message="No SERPAPI_KEY configured. Running in high-fidelity deterministic offline mode.",
                status="warning"
            ))
            return self._generate_simulated_scan(clean_target, thoughts)

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

        # --- STEP 1: Light-Touch RFC Telemetry: Live DNS & Mail Authentication Audit (SPF / DMARC / CAA) ---
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="RFC_TELEMETRY_DNS",
            message=f"Executing light-touch RFC telemetry: DNS records, SPF/DMARC mail policies, and CAA inspection for '{clean_target}'",
            status="info"
        ))
        dns_intel, dns_findings = audit_dns_and_email_security(clean_target)
        if dns_intel.get("ips"):
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="RFC_TELEMETRY_MAPPED",
                message=f"Resolved Apex IPs: {', '.join(dns_intel['ips'][:3])} | NS: {', '.join(dns_intel.get('nameservers', [])[:2])} | MX: {', '.join(dns_intel.get('mail_servers', [])[:2])}",
                status="success"
            ))
        for df in dns_findings:
            findings.append(df)
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PERIMETER_ANOMALY" if df.get("severity") in ["CRITICAL", "HIGH"] else "PERIMETER_NOTICE",
                message=f"DNS {df.get('severity')} finding: {df.get('title')}",
                status="critical" if df.get("severity") in ["CRITICAL", "HIGH"] else "warning"
            ))

        # --- STEP 2: Light-Touch Subdomain Resolution Sweep ---
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="SUBDOMAIN_SWEEP",
            message=f"Resolving standard RFC hostnames across corporate subdomains for perimeter baseline...",
            status="info"
        ))
        active_subs = probe_live_subdomains(clean_target)
        for sub in active_subs:
            register_host(sub["host"], sub["url"], sub["snippet"], sub["dork"], sub["engine"])
        if active_subs:
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="SUBDOMAIN_DISCOVERY",
                message=f"Light-touch DNS resolution mapped {len(active_subs)} live infrastructure subdomains.",
                status="success"
            ))

        # --- STEP 3: HTTP Perimeter Telemetry & Security Headers Audit ---
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="HTTP_TELEMETRY",
            message=f"Inspecting public RFC HTTP headers, CSP, Anti-Clickjacking, and robots.txt on 'https://{clean_target}'",
            status="info"
        ))
        web_profile, http_vulns, http_assets = audit_http_surface_and_headers(clean_target)
        for hv in http_vulns:
            findings.append(hv)
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="HEADER_DEFECT",
                message=f"Security Header {hv.get('severity')} Risk: {hv.get('title')}",
                status="critical" if hv.get("severity") in ["CRITICAL", "HIGH"] else "warning"
            ))
        for ha in http_assets:
            findings.append(ha)

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

        for res in p1_results:
            link = res.get("link", "")
            host = urlparse(link).netloc.lower()
            register_host(host, link, res.get("snippet", "Active subdomain asset."), pass1_query, "google")

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

        # --- OPTIONAL PHASE 2: THIRD-PARTY & SHADOW IT EXPANSION ---
        if enable_phase2:
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PHASE_2_INIT",
                message=f"Initiating Phase 2 Shadow IT & Threat Intelligence sweep for brand: '{brand_name}'",
                status="info"
            ))

            # Pass 2.1: Targeted GitHub Secret & Credential Exposure
            gh_query = f"site:github.com \"{clean_target}\" (filename:.env OR filename:credentials OR filename:secrets.json OR \"BEGIN RSA PRIVATE KEY\") -inurl:issues -inurl:pull"
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PASS_2_1",
                message=f"Auditing GitHub repositories for credential leaks: '{gh_query}'",
                status="info"
            ))
            gh_results, gh_err = self.execute_serpapi_query(gh_query, engine="google")
            if not gh_err:
                credits_used += 1
                for res in gh_results:
                    link = res.get("link", "")
                    link_lower = link.lower()
                    # Exclude issue trackers, pull requests, releases, and discussions (not leaks)
                    if any(x in link_lower for x in ["/issues/", "/pull/", "/releases/", "/discussions/"]):

                        continue
                    snip = res.get("snippet", "")
                    snip_lower = snip.lower()
                    is_doc_or_example = any(x in link_lower for x in ["/docs/", "/doc/", "/documentation/", "/example/", "/examples/", "/test/", "/tests/", "/mock/"])
                    has_dummy_template = any(x in snip_lower for x in ["<private_key>", "example", "dummy", "your_", "your-", "changeme", "template"])
                    is_secret = (
                        any(k in snip_lower for k in [".env", "private key", "api_key", "db_password", "client_secret"])
                        and not is_doc_or_example
                        and not has_dummy_template
                    )
                    playbook = get_remediation_for_category("GITHUB_LEAK")
                    external_findings.append({
                        "title": "Exposed Repository Secret Reference" if is_secret else "Public Repository Reference",
                        "category": "GITHUB_LEAK",
                        "severity": "CRITICAL" if is_secret else "LOW",
                        "url": link,
                        "snippet": snip or "GitHub repository referencing brand API credentials.",
                        "dork": gh_query,
                        "surface": "GitHub Repository",
                        "engine": "google",
                        "what_is_the_bug": f"Public GitHub repository referencing brand assets or credentials at {link}.",
                        "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                        "attack_vector": playbook.get("attack_vector"),
                        "how_to_fix": playbook.get("how_to_fix"),
                        "remediation": playbook.get("default_directive"),
                        "owasp_tag": playbook.get("owasp_tag"),
                        "cwe_id": playbook.get("cwe_id"),
                        "cvss_score": playbook.get("cvss_score") if is_secret else "CVSS 3.0 (Low)"
                    })

                    if len([f for f in external_findings if f["category"] == "GITHUB_LEAK"]) >= 3:
                        break

            # Pass 2.1B: GitHub Open Source & Ecosystem Integrations OSINT
            gh_repo_query = f"site:github.com \"{brand_name}\""
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PASS_2_1B",
                message=f"Harvesting public GitHub repositories & ecosystem tools: '{gh_repo_query}'",
                status="info"
            ))
            gh_repo_res, gh_repo_err = self.execute_serpapi_query(gh_repo_query, engine="google")
            if not gh_repo_err and gh_repo_res:
                credits_used += 1
                for res in gh_repo_res[:4]:
                    link = res.get("link", "")
                    if any(f.get("url") == link for f in external_findings):
                        continue
                    playbook = get_remediation_for_category("GITHUB_REPO")
                    external_findings.append({
                        "title": f"GitHub Repo: {res.get('title', 'Open Source Tool')[:50]}",
                        "category": "GITHUB_REPO",
                        "severity": "LOW",
                        "url": link,
                        "snippet": res.get("snippet", "Public GitHub repository mentioning target brand."),
                        "dork": gh_repo_query,
                        "surface": "GitHub Open Source",
                        "engine": "google",
                        "section": "INFO",
                        "what_is_the_bug": f"Public open-source repository or integration code referencing {brand_name} at {link}.",
                        "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                        "attack_vector": playbook.get("attack_vector"),
                        "how_to_fix": playbook.get("how_to_fix"),
                        "remediation": playbook.get("default_directive"),
                        "owasp_tag": playbook.get("owasp_tag"),
                        "cwe_id": playbook.get("cwe_id"),
                        "cvss_score": playbook.get("cvss_score")
                    })

            # Pass 2.1C: Pastebin & Public Gist Leak Sweep
            paste_query = f"(site:pastebin.com OR site:gist.github.com) (\"{clean_target}\" OR \"{brand_name}\")"
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PASS_2_1C",
                message=f"Auditing paste sites & public gists for leaked snippets: '{paste_query}'",
                status="info"
            ))
            paste_res, paste_err = self.execute_serpapi_query(paste_query, engine="google")
            if not paste_err and paste_res:
                credits_used += 1
                for res in paste_res[:2]:
                    link = res.get("link", "")
                    playbook = get_remediation_for_category("CONFIG_LEAK")
                    external_findings.append({
                        "title": f"Public Paste Snippet: {res.get('title', 'Leaked Pastebin Record')[:50]}",
                        "category": "CONFIG_LEAK",
                        "severity": "HIGH",
                        "url": link,
                        "snippet": res.get("snippet", "Public pastebin or gist snippet referencing target domain."),
                        "dork": paste_query,
                        "surface": "Pastebin / Gist Leak",
                        "engine": "google",
                        "section": "VULNERABILITY",
                        "what_is_the_bug": f"Public code paste referencing {clean_target} at {link}.",
                        "why_it_is_a_bug": "Adversaries paste extracted database records, configurations, or tokens to pastebin services.",
                        "attack_vector": "Attacker exfiltrates internal credentials or server dumps to public pastebin services.",
                        "how_to_fix": "Request immediate removal of paste and rotate any referenced credentials.",
                        "remediation": playbook.get("default_directive"),
                        "owasp_tag": playbook.get("owasp_tag"),
                        "cwe_id": playbook.get("cwe_id"),
                        "cvss_score": playbook.get("cvss_score")
                    })

            # Pass 2.2: Brand-Owned Cloud Storage Buckets (S3 / GCS)
            s3_query = f"(site:s3.amazonaws.com/{brand_name} OR site:storage.googleapis.com/{brand_name} OR site:*.s3.amazonaws.com \"{clean_target}\")"
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PASS_2_2",
                message=f"Auditing brand-owned cloud storage buckets: '{s3_query}'",
                status="info"
            ))
            s3_results, s3_err = self.execute_serpapi_query(s3_query, engine="google")
            if not s3_err:
                credits_used += 1
                for res in s3_results:
                    link = res.get("link", "")
                    parsed = urlparse(link)
                    host = parsed.netloc.lower()
                    path = parsed.path.lower()
                    # Verify ownership: brand must be in the host or top-level bucket path
                    if brand_name not in host and not path.startswith(f"/{brand_name}") and clean_target not in link.lower():
                        continue
                    is_leak = any(ext in link.lower() for ext in [".sql", ".env", ".bak", ".csv", ".json", ".zip", ".tar"])
                    playbook = get_remediation_for_category("S3_LEAK")
                    external_findings.append({
                        "title": "Public Cloud Storage Bucket Exposure" if is_leak else "Public Cloud Storage Asset",
                        "category": "S3_LEAK",
                        "severity": "HIGH" if is_leak else "LOW",
                        "url": link,
                        "snippet": res.get("snippet", "Cloud storage object."),
                        "dork": s3_query,
                        "surface": "AWS S3 / Cloud Storage",
                        "engine": "google",
                        "what_is_the_bug": f"Public cloud object store accessible at {link}.",
                        "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                        "attack_vector": playbook.get("attack_vector"),
                        "how_to_fix": playbook.get("how_to_fix"),
                        "remediation": playbook.get("default_directive"),
                        "owasp_tag": playbook.get("owasp_tag"),
                        "cwe_id": playbook.get("cwe_id"),
                        "cvss_score": playbook.get("cvss_score") if is_leak else "CVSS 3.0 (Low)"
                    })
                    if len([f for f in external_findings if f["category"] == "S3_LEAK"]) >= 3:
                        break

            # Pass 2.2B: External Web Footprint, Marketplace & Directory Mentions
            fp_query = f"\"{clean_target}\" -site:{clean_target}"
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PASS_2_2B_FOOTPRINT",
                message=f"Mapping third-party directories, tool catalogs & brand footprint: '{fp_query}'",
                status="info"
            ))
            fp_res, fp_err = self.execute_serpapi_query(fp_query, engine="google")
            if not fp_err and fp_res:
                credits_used += 1
                for res in fp_res[:4]:
                    link = res.get("link", "")
                    if any(f.get("url") == link for f in external_findings):
                        continue
                    playbook = get_remediation_for_category("BRAND_PRESENCE")
                    external_findings.append({
                        "title": f"Directory / Web Asset: {res.get('title', 'Third-Party Mention')[:55]}",
                        "category": "BRAND_PRESENCE",
                        "severity": "INFO",
                        "url": link,
                        "snippet": res.get("snippet", "External web directory or tool catalog entry."),
                        "dork": fp_query,
                        "surface": "External Web Footprint",
                        "engine": "google",
                        "section": "INFO",
                        "what_is_the_bug": f"Third-party directory listing or web mention referencing {clean_target}.",
                        "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                        "attack_vector": playbook.get("attack_vector"),
                        "how_to_fix": playbook.get("how_to_fix"),
                        "remediation": playbook.get("default_directive"),
                        "owasp_tag": playbook.get("owasp_tag"),
                        "cwe_id": playbook.get("cwe_id"),
                        "cvss_score": playbook.get("cvss_score")
                    })

            # Pass 2.3: Threat Intelligence & Security Bulletins (INFORMATIONAL ONLY, NOT A BUG)
            news_query = f"\"{brand_name}\" (security OR vulnerability OR breach OR exploit OR incident)"
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PASS_2_3",
                message=f"Gathering external OSINT threat intelligence: '{news_query}'",
                status="info"
            ))
            news_results, news_err = self.execute_serpapi_query(news_query, engine="google_news")
            if not news_err:
                credits_used += 1
                for res in news_results[:3]:
                    playbook = get_remediation_for_category("NEWS_BREACH")
                    external_findings.append({
                        "title": res.get("title", "Threat Intelligence Advisory"),
                        "category": "NEWS_BREACH",
                        "severity": "INFO", # Informational only — does not penalize health score!
                        "url": res.get("link", ""),
                        "snippet": res.get("snippet", "Security news bulletin regarding target ecosystem."),
                        "dork": news_query,
                        "surface": "Threat Intelligence News",
                        "engine": "google_news",
                        "what_is_the_bug": f"External threat intelligence bulletin referencing {brand_name}.",
                        "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                        "attack_vector": playbook.get("attack_vector"),
                        "how_to_fix": playbook.get("how_to_fix"),
                        "remediation": playbook.get("default_directive"),
                        "owasp_tag": playbook.get("owasp_tag"),
                        "cwe_id": playbook.get("cwe_id"),
                        "cvss_score": playbook.get("cvss_score")
                    })

            # Pass 2.4: YouTube Live Exploit & Bug Bounty Radar
            yt_query = f"\"{brand_name}\" (\"proof of concept\" OR \"vulnerability\" OR \"exploit\" OR \"bug bounty\")"
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PASS_2_4",
                message=f"Scanning YouTube for public exploit PoCs & bug bounty disclosures: '{yt_query}'",
                status="info"
            ))
            yt_results, yt_err = self.execute_serpapi_query(yt_query, engine="youtube")
            if not yt_err and yt_results:
                credits_used += 1
                for vid in yt_results:
                    v_title = vid.get("title", "")
                    v_link = vid.get("link", "")
                    v_snip = vid.get("description") or vid.get("snippet") or ""
                    
                    # Strict validation: video MUST genuinely discuss security (vulnerabilities, exploits, bug bounties, CVEs)
                    security_terms = ["vulnerability", "exploit", "cve", "proof of concept", "bug bounty", "poc", "zero-day", "hackerone", "xss", "sqli", "rce", "security research", "bypass", "breach"]
                    noise_terms = ["plugin", "update - links", "update -", "how to install", "tutorial", "walkthrough guide", "getting started", "template", "productivity", "review"]

                    text_corpus = (v_title + " " + v_snip).lower()
                    has_security = any(s in text_corpus for s in security_terms)
                    is_benign_noise = any(n in v_title.lower() for n in noise_terms) and not any(s in v_title.lower() for s in ["exploit", "cve", "vulnerability", "bounty", "poc"])

                    if not has_security or is_benign_noise:
                        continue

                    channel_info = vid.get("channel", {})
                    channel_name = channel_info.get("name", "Unknown Channel") if isinstance(channel_info, dict) else str(channel_info)
                    views = vid.get("views", "N/A")
                    pub_date = vid.get("published_date", "")

                    playbook = get_remediation_for_category("YOUTUBE_POC")
                    external_findings.append({
                        "title": v_title[:65],
                        "category": "YOUTUBE_POC",
                        "severity": "INFO",
                        "url": v_link,
                        "snippet": f"Channel: {channel_name} | Views: {views} | {pub_date}. {v_snip}"[:250],
                        "dork": yt_query,
                        "surface": "YouTube Exploit Radar",
                        "engine": "youtube",
                        "what_is_the_bug": f"Researcher exploit demonstration video referencing {brand_name}.",
                        "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                        "attack_vector": playbook.get("attack_vector"),
                        "how_to_fix": playbook.get("how_to_fix"),
                        "remediation": playbook.get("default_directive"),
                        "owasp_tag": playbook.get("owasp_tag"),
                        "cwe_id": playbook.get("cwe_id"),
                        "cvss_score": playbook.get("cvss_score")
                    })
                    if len([f for f in external_findings if f["category"] == "YOUTUBE_POC"]) >= 3:
                        break

            # Pass 2.5: Google Play Mobile Perimeter Mapping
            play_query = brand_name
            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PASS_2_5",
                message=f"Mapping mobile application perimeter via Google Play: '{play_query}'",
                status="info"
            ))
            play_results, play_err = self.execute_serpapi_query(play_query, engine="google_play")
            if not play_err and play_results:
                credits_used += 1
                for app in play_results:
                    app_title = app.get("title", "")
                    pkg_id = app.get("product_id", "")
                    app_link = app.get("link", "")
                    # Match brand in package ID or title to avoid irrelevant competitor apps
                    if brand_name in pkg_id.lower() or brand_name in app_title.lower():
                        dev = app.get("developer", "N/A")
                        rating = app.get("rating", "N/A")
                        playbook = get_remediation_for_category("MOBILE_APP")
                        external_findings.append({
                            "title": f"Mobile Client: {app_title}",
                            "category": "MOBILE_APP",
                            "severity": "INFO",
                            "url": app_link,
                            "snippet": f"Package: {pkg_id} | Rating: {rating}★ | Developer: {dev}",
                            "dork": f"engine:google_play q={play_query}",
                            "surface": "Google Play Store",
                            "engine": "google_play",
                            "what_is_the_bug": f"Published mobile application perimeter asset ({pkg_id}).",
                            "why_it_is_a_bug": playbook.get("why_it_is_a_bug"),
                            "attack_vector": playbook.get("attack_vector"),
                            "how_to_fix": playbook.get("how_to_fix"),
                            "remediation": playbook.get("default_directive"),
                            "owasp_tag": playbook.get("owasp_tag"),
                            "cwe_id": playbook.get("cwe_id"),
                            "cvss_score": playbook.get("cvss_score")
                        })
                        if len([f for f in external_findings if f["category"] == "MOBILE_APP"]) >= 2:
                            break

            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PHASE_2_COMPLETE",
                message=f"Phase 2 Complete: Mapped external ecosystem, YouTube exploit radar, and mobile attack surface.",
                status="success"
            ))

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
            ai_discarded_noise_count=total_discarded,
            security_score=score,
            security_grade=grade,
            serpapi_credits_used=credits_used,
            generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )

        result = ScanResult(
            summary=summary,
            executive_summary=exec_summary,
            nodes=nodes,
            edges=edges,
            thoughts=thoughts
        )

        return result


    def _generate_simulated_scan(self, target: str, thoughts: List[AgentThought]) -> ScanResult:
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

        external_findings = [
            {
                "title": f"Research PoC Video: Auth Flow Analysis on {target.title()}",
                "category": "YOUTUBE_POC",
                "severity": "INFO",
                "url": "https://www.youtube.com/watch?v=sample_poc_demo",
                "snippet": f"Channel: CyberSecurityLab | Views: 14.2K | 2026. Live proof of concept demonstrating OAuth flow anomaly on {target}.",
                "dork": f"engine:youtube search_query='{target} vulnerability'",
                "surface": "YouTube Exploit Radar",
                "engine": "youtube"
            },
            {
                "title": f"Mobile Client: {target.title()} Workspace",
                "category": "MOBILE_APP",
                "severity": "INFO",
                "url": f"https://play.google.com/store/apps/details?id=com.{target.split('.')[0]}.app",
                "snippet": f"Package: com.{target.split('.')[0]}.app | Rating: 4.8★ | Developer: {target.title()} Official",
                "dork": f"engine:google_play q={target.split('.')[0]}",
                "surface": "Google Play Store",
                "engine": "google_play"
            }
        ]

        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="SYNTHESIS",
            message=f"Constructed multi-engine attack surface graph for {target} with 3 subdomains, 3 findings, and 2 threat intel assets.",
            status="success"
        ))

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
            ai_discarded_noise_count=0,
            security_score=score,
            security_grade=grade,
            serpapi_credits_used=0,
            generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )

        return ScanResult(
            summary=summary,
            executive_summary=exec_summary,
            nodes=nodes,
            edges=edges,
            thoughts=thoughts
        )
