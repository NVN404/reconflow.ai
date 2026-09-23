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

