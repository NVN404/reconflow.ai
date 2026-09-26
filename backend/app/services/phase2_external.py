"""
ReconFlow AI: Phase 2 External Threat Radar & Shadow IT Intelligence Scanner
=============================================================================
Autonomous sweep across external, third-party platforms via SerpApi:
  1. AWS S3 & Google Cloud Storage Buckets (Pass 2.2)
  2. Public GitHub Credential Leaks & Repositories (Pass 2.1, 2.1B, 2.1C)
  3. Real-Time Security Incident & Threat News via google_news (Pass 2.3)
  4. YouTube Exploit Proof-of-Concept & Bug Bounty Radar via youtube (Pass 2.4)
  5. Google Play Store Mobile Application Perimeter via google_play (Pass 2.5)

Zero exploitation payloads, zero brute-force fuzzing. Purely queries public search engine indexes.
"""

import datetime
from typing import List, Dict, Any, Tuple, Callable
from urllib.parse import urlparse

from app.schemas import AgentThought
from app.remediation import get_remediation_for_category


class Phase2ExternalScanner:
    """Modular External Attack Surface & Threat Intelligence Scanner powered by SerpApi."""

    def __init__(self, api_key: str, execute_serpapi_fn: Callable[[str, str], Tuple[List[Dict[str, Any]], Any]]):
        self.api_key = api_key
        self.execute_serpapi_query = execute_serpapi_fn

    def run_phase2_sweep(
        self,
        clean_target: str,
        brand_name: str
    ) -> Tuple[List[Dict[str, Any]], List[AgentThought], int]:
        """
        Executes the full Phase 2 external multi-engine sweep.
        Returns:
          (external_findings, thoughts, credits_used)
        """
        external_findings: List[Dict[str, Any]] = []
        thoughts: List[AgentThought] = []
        credits_used = 0

        now = datetime.datetime.now().strftime("%H:%M:%S")
        thoughts.append(AgentThought(
            timestamp=now,
            stage="PHASE_2_INIT",
            message=f"Initiating Phase 2 External Threat Radar & Shadow IT sweep for brand: '{brand_name}'",
            status="info"
        ))

        # --- 1. GITHUB SECRET & CREDENTIAL LEAK AUDIT ---
        gh_findings, gh_thoughts, gh_credits = self._audit_github_leaks(clean_target, brand_name)
        external_findings.extend(gh_findings)
        thoughts.extend(gh_thoughts)
        credits_used += gh_credits

        # --- 2. PUBLIC CLOUD STORAGE BUCKETS (AWS S3 & GCS) ---
        s3_findings, s3_thoughts, s3_credits = self._audit_cloud_storage(clean_target, brand_name)
        external_findings.extend(s3_findings)
        thoughts.extend(s3_thoughts)
        credits_used += s3_credits

        # --- 3. THIRD-PARTY DIRECTORY & WEB FOOTPRINT ---
        fp_findings, fp_thoughts, fp_credits = self._audit_web_footprint(clean_target, brand_name)
        external_findings.extend(fp_findings)
        thoughts.extend(fp_thoughts)
        credits_used += fp_credits

        # --- 4. THREAT INTELLIGENCE & INCIDENT NEWS (google_news) ---
        news_findings, news_thoughts, news_credits = self._audit_threat_news(clean_target, brand_name)
        external_findings.extend(news_findings)
        thoughts.extend(news_thoughts)
        credits_used += news_credits

        # --- 5. YOUTUBE EXPLOIT POC & BUG BOUNTY RADAR (youtube) ---
        yt_findings, yt_thoughts, yt_credits = self._audit_youtube_radar(clean_target, brand_name)
        external_findings.extend(yt_findings)
        thoughts.extend(yt_thoughts)
        credits_used += yt_credits

        # --- 6. GOOGLE PLAY STORE MOBILE PERIMETER (google_play) ---
        play_findings, play_thoughts, play_credits = self._audit_google_play(clean_target, brand_name)
        external_findings.extend(play_findings)
        thoughts.extend(play_thoughts)
        credits_used += play_credits

        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PHASE_2_COMPLETE",
            message=f"Phase 2 Complete: Mapped external cloud buckets, GitHub leaks, YouTube exploit radar, and mobile perimeter.",
            status="success"
        ))

        return external_findings, thoughts, credits_used

    def _audit_github_leaks(
        self, clean_target: str, brand_name: str
    ) -> Tuple[List[Dict[str, Any]], List[AgentThought], int]:
        findings: List[Dict[str, Any]] = []
        thoughts: List[AgentThought] = []
        credits = 0

        # Pass 2.1: Targeted GitHub Secret & Credential Exposure
        gh_query = f"site:github.com \"{clean_target}\" (filename:.env OR filename:credentials OR filename:secrets.json OR \"BEGIN RSA PRIVATE KEY\") -inurl:issues -inurl:pull"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_2_1",
            message=f"Auditing GitHub repositories for credential leaks: '{gh_query}'",
            status="info"
        ))
        gh_results, gh_err = self.execute_serpapi_query(gh_query, engine="google")
        if not gh_err and gh_results:
            credits += 1
            for res in gh_results:
                link = res.get("link", "")
                link_lower = link.lower()
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
                findings.append({
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
                if len([f for f in findings if f["category"] == "GITHUB_LEAK"]) >= 3:
                    break

        # Pass 2.1B: GitHub Open Source & Ecosystem Integrations
        gh_repo_query = f"site:github.com \"{brand_name}\""
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_2_1B",
            message=f"Harvesting public GitHub repositories & ecosystem tools: '{gh_repo_query}'",
            status="info"
        ))
        gh_repo_res, gh_repo_err = self.execute_serpapi_query(gh_repo_query, engine="google")
        if not gh_repo_err and gh_repo_res:
            credits += 1
            for res in gh_repo_res[:3]:
                link = res.get("link", "")
                if any(f.get("url") == link for f in findings):
                    continue
                playbook = get_remediation_for_category("GITHUB_REPO")
                findings.append({
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
            credits += 1
            for res in paste_res[:2]:
                link = res.get("link", "")
                playbook = get_remediation_for_category("CONFIG_LEAK")
                findings.append({
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

        return findings, thoughts, credits

    def _audit_cloud_storage(
        self, clean_target: str, brand_name: str
    ) -> Tuple[List[Dict[str, Any]], List[AgentThought], int]:
        findings: List[Dict[str, Any]] = []
        thoughts: List[AgentThought] = []
        credits = 0

        s3_query = f"(site:s3.amazonaws.com/{brand_name} OR site:storage.googleapis.com/{brand_name} OR site:*.s3.amazonaws.com \"{clean_target}\")"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_2_2",
            message=f"Auditing brand-owned cloud storage buckets: '{s3_query}'",
            status="info"
        ))
        s3_results, s3_err = self.execute_serpapi_query(s3_query, engine="google")
        if not s3_err and s3_results:
            credits += 1
            for res in s3_results:
                link = res.get("link", "")
                parsed = urlparse(link)
                host = parsed.netloc.lower()
                path = parsed.path.lower()
                if brand_name not in host and not path.startswith(f"/{brand_name}") and clean_target not in link.lower():
                    continue
                is_leak = any(ext in link.lower() for ext in [".sql", ".env", ".bak", ".csv", ".json", ".zip", ".tar"])
                playbook = get_remediation_for_category("S3_LEAK")
                findings.append({
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
                if len([f for f in findings if f["category"] == "S3_LEAK"]) >= 3:
                    break

        return findings, thoughts, credits

    def _audit_web_footprint(
        self, clean_target: str, brand_name: str
    ) -> Tuple[List[Dict[str, Any]], List[AgentThought], int]:
        findings: List[Dict[str, Any]] = []
        thoughts: List[AgentThought] = []
        credits = 0

        fp_query = f"\"{clean_target}\" -site:{clean_target}"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_2_2B_FOOTPRINT",
            message=f"Mapping third-party directories, tool catalogs & brand footprint: '{fp_query}'",
            status="info"
        ))
        fp_res, fp_err = self.execute_serpapi_query(fp_query, engine="google")
        if not fp_err and fp_res:
            credits += 1
            for res in fp_res[:3]:
                link = res.get("link", "")
                if any(f.get("url") == link for f in findings):
                    continue
                playbook = get_remediation_for_category("BRAND_PRESENCE")
                findings.append({
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

        return findings, thoughts, credits

    def _audit_threat_news(
        self, clean_target: str, brand_name: str
    ) -> Tuple[List[Dict[str, Any]], List[AgentThought], int]:
        findings: List[Dict[str, Any]] = []
        thoughts: List[AgentThought] = []
        credits = 0

        news_query = f"\"{brand_name}\" (security OR vulnerability OR breach OR exploit OR incident)"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_2_3",
            message=f"Gathering external OSINT threat intelligence: '{news_query}'",
            status="info"
        ))
        news_results, news_err = self.execute_serpapi_query(news_query, engine="google_news")
        if not news_err and news_results:
            credits += 1
            for res in news_results[:3]:
                playbook = get_remediation_for_category("NEWS_BREACH")
                findings.append({
                    "title": res.get("title", "Threat Intelligence Advisory"),
                    "category": "NEWS_BREACH",
                    "severity": "INFO",
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

        return findings, thoughts, credits

    def _audit_youtube_radar(
        self, clean_target: str, brand_name: str
    ) -> Tuple[List[Dict[str, Any]], List[AgentThought], int]:
        findings: List[Dict[str, Any]] = []
        thoughts: List[AgentThought] = []
        credits = 0

        yt_query = f"\"{brand_name}\" (\"proof of concept\" OR \"vulnerability\" OR \"exploit\" OR \"bug bounty\")"
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_2_4",
            message=f"Scanning YouTube for public exploit PoCs & bug bounty disclosures: '{yt_query}'",
            status="info"
        ))
        yt_results, yt_err = self.execute_serpapi_query(yt_query, engine="youtube")
        if not yt_err and yt_results:
            credits += 1
            security_terms = ["vulnerability", "exploit", "cve", "proof of concept", "bug bounty", "poc", "zero-day", "hackerone", "xss", "sqli", "rce", "security research", "bypass", "breach"]
            noise_terms = ["plugin", "update - links", "update -", "how to install", "tutorial", "walkthrough guide", "getting started", "template", "productivity", "review"]

            for vid in yt_results:
                v_title = vid.get("title", "")
                v_link = vid.get("link", "")
                v_snip = vid.get("description") or vid.get("snippet") or ""

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
                findings.append({
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
                if len([f for f in findings if f["category"] == "YOUTUBE_POC"]) >= 3:
                    break

        return findings, thoughts, credits

    def _audit_google_play(
        self, clean_target: str, brand_name: str
    ) -> Tuple[List[Dict[str, Any]], List[AgentThought], int]:
        findings: List[Dict[str, Any]] = []
        thoughts: List[AgentThought] = []
        credits = 0

        play_query = brand_name
        thoughts.append(AgentThought(
            timestamp=datetime.datetime.now().strftime("%H:%M:%S"),
            stage="PASS_2_5",
            message=f"Mapping mobile application perimeter via Google Play: '{play_query}'",
            status="info"
        ))
        play_results, play_err = self.execute_serpapi_query(play_query, engine="google_play")
        if not play_err and play_results:
            credits += 1
            for app in play_results:
                app_title = app.get("title", "")
                pkg_id = app.get("product_id", "")
                app_link = app.get("link", "")
                if brand_name in pkg_id.lower() or brand_name in app_title.lower():
                    dev = app.get("developer", "N/A")
                    rating = app.get("rating", "N/A")
                    playbook = get_remediation_for_category("MOBILE_APP")
                    findings.append({
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
                    if len([f for f in findings if f["category"] == "MOBILE_APP"]) >= 2:
                        break

        return findings, thoughts, credits
