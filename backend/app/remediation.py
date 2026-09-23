from typing import Dict, Any

REMEDIATION_PLAYBOOKS: Dict[str, Dict[str, Any]] = {
    "CONFIG_LEAK": {
        "title": "Exposed Configuration & Environment Files",
        "severity": "CRITICAL",
        "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
        "cwe_id": "CWE-200: Exposure of Sensitive Information",
        "description": "Public web crawlers and threat actors can read plaintext database credentials, API secrets, and server environment variables directly.",
        "actions": [
            "1. Web Server Rule (NGINX):\n   location ~ /\\.(?!well-known) {\n       deny all;\n       return 404;\n   }",
            "2. Web Server Rule (Apache):\n   <FilesMatch \"^\\.\">\n       Require all denied\n   </FilesMatch>",
            "3. Immediate Key Rotation:\n   Invalidate and rotate every database password, JWT secret, and API token exposed in the file.",
            "4. Search Engine De-indexing:\n   Submit an emergency URL removal request via Google Search Console to purge cached copies."
        ],
        "default_directive": "Block access to dotfiles in NGINX ('location ~ /\\.(?!well-known) { deny all; return 404; }') and rotate all exposed database credentials immediately."
    },
    "API_DOCS": {
        "title": "Public Swagger / GraphQL API Documentation",
        "severity": "MEDIUM",
        "owasp_tag": "OWASP A01:2021 — Broken Access Control",
        "cwe_id": "CWE-215: Insertion of Sensitive Information into Debugging Code",
        "description": "Interactive API schemas expose full route parameters, internal models, and unauthenticated endpoints to automated scanners.",
        "actions": [
            "1. Reverse Proxy Authentication:\n   Place /swagger-ui, /docs, and /graphiql behind corporate OAuth2 or HTTP Basic Authentication.",
            "2. Production Schema Hardening:\n   Disable GraphQL schema introspection in production environments.",
            "3. Search Header Injection:\n   Inject HTTP response header: 'X-Robots-Tag: noindex, nofollow' across all documentation routes."
        ],
        "default_directive": "Place API documentation routes behind an authenticated gateway or corporate VPN. Inject 'X-Robots-Tag: noindex, nofollow' response header."
    },
    "INFRASTRUCTURE": {
        "title": "Unmapped Staging or QA Subdomain",
        "severity": "LOW",
        "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
        "cwe_id": "CWE-1004: Sensitive Cookie Without 'HttpOnly' Flag",
        "description": "Forgotten staging and QA portals provide soft targets for credential stuffing and unpatched CVE testing.",
        "actions": [
            "1. Network Isolation:\n   Restrict staging access via corporate VPN or Cloudflare Zero Trust Access.",
            "2. DNS Zone Audit:\n   Decommission dangling CNAME records to prevent Subdomain Takeover attacks."
        ],
        "default_directive": "Enforce corporate SSO or IP allowlisting on pre-production subdomains. Audit DNS to avoid dangling CNAME takeover."
    },
    "GITHUB_LEAK": {
        "title": "Source Code & Private Key Leak on GitHub",
        "severity": "CRITICAL",
        "owasp_tag": "OWASP A07:2021 — Identification and Authentication Failures",
        "cwe_id": "CWE-312: Cleartext Storage of Sensitive Information",
        "description": "Credentials or private keys committed to public git repositories are actively harvested by threat crawlers.",
        "actions": [
            "1. Immediate Revocation:\n   Revoke the compromised keys in your cloud provider console immediately.",
            "2. Rewrite Git History:\n   git filter-repo --invert-paths --path <leaked-file>",
            "3. Workstation Enforcement:\n   Enforce pre-commit secret scanners (TruffleHog / Gitleaks) on all developer repositories."
        ],
        "default_directive": "Immediately revoke key in cloud console. Rewrite commit history using 'git-filter-repo'. Deploy pre-commit secret hooks."
    },
    "S3_LEAK": {
        "title": "Misconfigured Public Cloud Storage Bucket",
        "severity": "HIGH",
        "owasp_tag": "OWASP A01:2021 — Broken Access Control",
        "cwe_id": "CWE-552: Files or Directories Accessible to External Parties",
        "description": "Cloud object storage bucket indexing corporate documents or database exports with public read permissions.",
        "actions": [
            "1. AWS S3 CLI Block Public Access:\n   aws s3api put-public-access-block --bucket <bucket-name> \\\n     --public-access-block-configuration \"BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true\"",
            "2. Signed URLs:\n   Migrate asset distribution to short-lived cryptographically signed Pre-Signed URLs."
        ],
        "default_directive": "Enable AWS S3 'Block Public Access' at account root. Audit bucket ACLs and replace public links with short-lived Pre-Signed URLs."
    },
    "NEWS_BREACH": {
        "title": "Threat Intelligence & Security Research",
        "severity": "INFO",
        "owasp_tag": None,
        "cwe_id": None,
        "description": "Public cybersecurity article, research publication, or threat intelligence bulletin referencing the organization's technology ecosystem.",
        "actions": [
            "1. Threat Intelligence Monitoring: Review mentioned techniques to confirm perimeter defenses are resilient.",
            "2. Advisory Context: This is external security intelligence, not an active vulnerability or server misconfiguration on your perimeter."
        ],
        "default_directive": "Informational OSINT Advisory: Review the referenced research to ensure defense-in-depth posture. No server-side vulnerability detected on target domain."
    },
    "TOKEN_LEAK": {
        "title": "Exposed API Key / Cloud Access Secret",
        "severity": "CRITICAL",
        "owasp_tag": "OWASP A07:2021 — Identification and Authentication Failures",
        "cwe_id": "CWE-798: Use of Hard-coded Credentials",
        "description": "Live API keys (e.g. AWS AKIA, Google AIzaSy, Stripe sk_live_, GitHub ghp_) indexed in client bundles or public endpoints.",
        "actions": [
            "1. Cloud Console Revocation:\n   Revoke the compromised token in your provider console (AWS IAM, Google Cloud, Stripe, GitHub) immediately.",
            "2. Access Log Audit:\n   Review cloud provider audit logs for unauthorized API calls performed with the compromised credentials over the last 30 days.",
            "3. Architecture Sanitization:\n   Ensure backend proxy endpoints handle third-party service calls instead of embedding secret keys in frontend builds.",
            "4. Search Engine Cache Purge:\n   Submit an emergency de-indexing request via Google Search Console to remove cached snippets."
        ],
        "default_directive": "Immediately revoke exposed API key in provider console. Audit IAM access logs and purge cached asset from search engines."
    },
    "DOCUMENT_LEAK": {
        "title": "Confidential Corporate Document Indexed",
        "severity": "HIGH",
        "owasp_tag": "OWASP A01:2021 — Broken Access Control",
        "cwe_id": "CWE-200: Exposure of Sensitive Information",
        "description": "Confidential or internal corporate spreadsheets, PDFs, or presentations indexed by public search crawlers.",
        "actions": [
            "1. Web Server Access Restriction:\n   Restrict public directory indexing and require corporate SSO for internal document repositories.",
            "2. Header Hardening:\n   Add 'X-Robots-Tag: noindex, noarchive' to all internal document downloads.",
            "3. Google Search Console De-indexation:\n   Submit an urgent removal request to purge cached copies and snippets from search engine indices."
        ],
        "default_directive": "Remove file from public web root or enforce SSO. Add 'X-Robots-Tag: noindex' and request immediate Google Search Console URL removal."
    },
    "YOUTUBE_POC": {
        "title": "Public Exploit & Bug Bounty Disclosure Video",
        "severity": "INFO",
        "owasp_tag": None,
        "cwe_id": None,
        "description": "Security researcher demonstration video detailing a proof-of-concept exploit, vulnerability walk-through, or bug bounty finding referencing the target ecosystem.",
        "actions": [
            "1. Video Review & Triage:\n   Watch the proof-of-concept video to determine the specific component, endpoint, or vector demonstrated.",
            "2. Patch Verification:\n   Cross-reference with internal patch records to verify whether the vulnerability has already been mitigated in production.",
            "3. Researcher Outreach:\n   If the video discloses an uncoordinated 0-day, contact the author via their channel contacts for responsible disclosure."
        ],
        "default_directive": "Threat Intel PoC Radar: Review researcher video to verify if demonstrated exploit vector has been patched in your current deployment."
    },
    "MOBILE_APP": {
        "title": "Official Mobile Application Perimeter",
        "severity": "INFO",
        "owasp_tag": None,
        "cwe_id": None,
        "description": "Official Android/iOS application package published in public app stores, representing a mobile client perimeter.",
        "actions": [
            "1. Mobile Backend API Audit:\n   Verify that API endpoints consumed by the mobile client enforce strict authentication and rate-limiting.",
            "2. Certificate Pinning:\n   Ensure mobile client utilizes SSL certificate pinning to prevent MitM interception by attackers.",
            "3. Obfuscation & Key Protection:\n   Enforce ProGuard/R8 bytecode obfuscation and eliminate hardcoded backend secrets in APK assets."
        ],
        "default_directive": "Mobile Perimeter Asset: Verify mobile client uses SSL pinning, bytecode obfuscation, and connects only to authenticated backend gateways."
    }
}

def get_remediation_for_category(category: str) -> Dict[str, Any]:
    cat = category.upper()
    if cat in REMEDIATION_PLAYBOOKS:
        return REMEDIATION_PLAYBOOKS[cat]
    return {
        "title": "General Perimeter Monitoring",
        "severity": "INFO",
        "owasp_tag": None,
        "cwe_id": None,
        "actions": ["Review asset accessibility and verify principle of least privilege."],
        "default_directive": "Review asset exposure and restrict to authorized network boundaries."
    }

