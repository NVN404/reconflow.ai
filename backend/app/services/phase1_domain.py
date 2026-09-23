import re
import datetime
from urllib.parse import urlparse
from typing import List, Dict, Any, Tuple, Optional
import requests


from app.config import SERPAPI_KEY, get_serpapi_key
from app.cache import get_cached_scan, set_cached_scan
from app.schemas import ScanResult, ScanSummary, AgentThought
from app.services.triage import compute_security_score, build_executive_summary, layout_graph

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
                    url_lower = link.lower()
                    if any(k in url_lower for k in ["admin", "login", "auth", "portal", "dashboard"]):
                        findings.append({
                            "title": "Public Authentication / Admin Gateway",
                            "category": "INFRASTRUCTURE",
                            "severity": "LOW",
                            "host": host,
                            "url": link,
                            "snippet": res.get("snippet", "Exposed public login / access portal."),
                            "dork": pass2_query,
                            "surface": "Authentication Gateway",
                            "engine": "google"
                        })
                    elif any(k in url_lower for k in ["docs", "api", "swagger", "graphiql", "redoc"]):
                        findings.append({
                            "title": "Public API & Documentation Portal",
                            "category": "API_DOCS",
                            "severity": "MEDIUM",
                            "host": host,
                            "url": link,
                            "snippet": res.get("snippet", "Interactive developer schema exposing endpoints."),
                            "dork": pass2_query,
                            "surface": "Interactive Documentation",
                            "engine": "google"
                        })

        # --- PASS 1.3: Sensitive Configuration Files & Database Dumps ---
        pass3_query = f"site:{clean_target} (filetype:env OR filetype:sql OR filetype:yaml OR filetype:log OR filetype:bak OR intitle:\"index of /\")"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_1_3",
            message=f"Auditing perimeter for configuration leaks: '{pass3_query}'",
            status="info"
        ))
        p3_results, p3_err = self.execute_serpapi_query(pass3_query, engine="google")
        if not p3_err:
            credits_used += 1
            for res in p3_results:
                link = res.get("link", "")
                host = urlparse(link).netloc.lower()
                if host == clean_target or host.endswith("." + clean_target):
                    is_env = ".env" in link
                    findings.append({
                        "title": "Exposed Configuration .env File" if is_env else "Sensitive Database / Log Backup",
                        "category": "CONFIG_LEAK",
                        "severity": "CRITICAL",
                        "host": host,
                        "url": link,
                        "snippet": res.get("snippet", "Production secrets or configuration files exposed."),
                        "dork": pass3_query,
                        "surface": "Web Server Root",
                        "engine": "google"
                    })
                    thoughts.append(AgentThought(
                        timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                        stage="CRITICAL_ANOMALY",
                        message=f"CRITICAL leak detected: {link}",
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
                if host == clean_target or host.endswith("." + clean_target):
                    snip = res.get("snippet", "")
                    matched_sig = "API Key"
                    for sig in ["AIzaSy", "sk_live_", "ghp_", "AKIA"]:
                        if sig in snip or sig in link:
                            matched_sig = sig
                            break
                    findings.append({
                        "title": f"Exposed Cloud Secret / Token Signature ({matched_sig})",
                        "category": "TOKEN_LEAK",
                        "severity": "CRITICAL",
                        "host": host,
                        "url": link,
                        "snippet": snip or "Hardcoded API key signature detected in public endpoint.",
                        "dork": token_query,
                        "surface": "Web Client Bundle / Source",
                        "engine": "google"
                    })
                    thoughts.append(AgentThought(
                        timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                        stage="CRITICAL_ANOMALY",
                        message=f"CRITICAL Token signature detected on {host}: {matched_sig}",
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
                if host == clean_target or host.endswith("." + clean_target):
                    findings.append({
                        "title": "Indexed Confidential Corporate Document",
                        "category": "DOCUMENT_LEAK",
                        "severity": "HIGH",
                        "host": host,
                        "url": link,
                        "snippet": res.get("snippet", "Internal corporate document exposed to public crawlers."),
                        "dork": doc_query,
                        "surface": "Internal Corporate Document",
                        "engine": "google"
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
                    external_findings.append({
                        "title": "Exposed Repository Secret Reference" if is_secret else "Public Repository Reference",
                        "category": "GITHUB_LEAK",
                        "severity": "CRITICAL" if is_secret else "LOW",
                        "url": link,
                        "snippet": snip or "GitHub repository referencing brand API credentials.",
                        "dork": gh_query,
                        "surface": "GitHub Repository",
                        "engine": "google"
                    })

                    if len([f for f in external_findings if f["category"] == "GITHUB_LEAK"]) >= 3:
                        break

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
                    external_findings.append({
                        "title": "Public Cloud Storage Bucket Exposure" if is_leak else "Public Cloud Storage Asset",
                        "category": "S3_LEAK",
                        "severity": "HIGH" if is_leak else "LOW",
                        "url": link,
                        "snippet": res.get("snippet", "Cloud storage object."),
                        "dork": s3_query,
                        "surface": "AWS S3 / Cloud Storage",
                        "engine": "google"
                    })
                    if len([f for f in external_findings if f["category"] == "S3_LEAK"]) >= 3:
                        break

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
                    external_findings.append({
                        "title": res.get("title", "Threat Intelligence Advisory"),
                        "category": "NEWS_BREACH",
                        "severity": "INFO", # Informational only — does not penalize health score!
                        "url": res.get("link", ""),
                        "snippet": res.get("snippet", "Security news bulletin regarding target ecosystem."),
                        "dork": news_query,
                        "surface": "Threat Intelligence News",
                        "engine": "google_news"
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
                    
                    # Verify relevance: video must reference the brand or target domain
                    if brand_name not in v_title.lower() and brand_name not in v_snip.lower() and clean_target not in v_snip.lower():
                        continue

                    channel_info = vid.get("channel", {})
                    channel_name = channel_info.get("name", "Unknown Channel") if isinstance(channel_info, dict) else str(channel_info)
                    views = vid.get("views", "N/A")
                    pub_date = vid.get("published_date", "")

                    external_findings.append({
                        "title": f"Exploit / Bounty Video: {v_title[:60]}",
                        "category": "YOUTUBE_POC",
                        "severity": "INFO",
                        "url": v_link,
                        "snippet": f"Channel: {channel_name} | Views: {views} | {pub_date}. {v_snip}"[:250],
                        "dork": yt_query,
                        "surface": "YouTube Exploit Radar",
                        "engine": "youtube"
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
                        external_findings.append({
                            "title": f"Mobile Client: {app_title}",
                            "category": "MOBILE_APP",
                            "severity": "INFO",
                            "url": app_link,
                            "snippet": f"Package: {pkg_id} | Rating: {rating}★ | Developer: {dev}",
                            "dork": f"engine:google_play q={play_query}",
                            "surface": "Google Play Store",
                            "engine": "google_play"
                        })
                        if len([f for f in external_findings if f["category"] == "MOBILE_APP"]) >= 2:
                            break

            thoughts.append(AgentThought(
                timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
                stage="PHASE_2_COMPLETE",
                message=f"Phase 2 Complete: Mapped external ecosystem, YouTube exploit radar, and mobile attack surface.",
                status="success"
            ))

        # Assemble Graph with auto-layout
        nodes, edges = layout_graph(clean_target, subdomains, findings, external_findings)

        critical_count = sum(1 for f in findings + external_findings if f.get("severity") == "CRITICAL")
        high_count = sum(1 for f in findings + external_findings if f.get("severity") == "HIGH")
        medium_count = sum(1 for f in findings + external_findings if f.get("severity") == "MEDIUM")
        low_count = len(subdomains) + sum(1 for f in findings + external_findings if f.get("severity") == "LOW")
        info_count = 1 + sum(1 for f in findings + external_findings if f.get("severity") == "INFO")


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
                "title": f"Exploit / Bounty Video: Bypassing Auth on {target.title()}",
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
