from typing import Dict, Any, List

REMEDIATION_PLAYBOOKS: Dict[str, Dict[str, Any]] = {
    "CONFIG_LEAK": {
        "title": "Exposed Sensitive Configuration & Environment (.env) File",
        "severity": "CRITICAL",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H (9.8 Critical)",
        "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
        "cwe_id": "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor",
        "what_is_the_bug": (
            "A sensitive configuration file (such as .env, database dumps, .yaml, or server backup files) "
            "is publicly accessible via the web server root without requiring authentication or authorization."
        ),
        "why_it_is_a_bug": (
            "Environment and configuration files typically contain plaintext high-privilege credentials: "
            "database connection strings (DB_PASSWORD), master encryption keys (SECRET_KEY), cloud infrastructure tokens "
            "(AWS_ACCESS_KEY_ID), payment gateway API secrets (STRIPE_SECRET_KEY), and SMTP mail server passwords. "
            "When these files are accessible to public web crawlers or adversaries, an attacker can directly download them, "
            "extract the master secrets, bypass all application-level authentication, and achieve total administrative compromise "
            "over the database, backend services, and cloud tenant infrastructure."
        ),
        "attack_vector": (
            "1. Automated Reconnaissance: Attacker uses specialized Google dorking queries (e.g. 'filetype:env DB_PASSWORD') to discover indexed dotfiles.\n"
            "2. Direct Credential Extraction: Attacker sends an unauthenticated HTTP GET request to download the raw configuration file.\n"
            "3. Lateral Movement: Attacker connects directly to exposed PostgreSQL/MySQL database ports or issues unauthorized AWS IAM / Stripe API calls with root privileges."
        ),
        "how_to_fix": (
            "1. Immediately deny public access to dotfiles and configuration backups at the web server / reverse proxy layer.\n"
            "2. Revoke and rotate every single password, key, and token contained within the compromised file immediately.\n"
            "3. Submit an emergency de-indexing and cache purge request via Google Search Console.\n"
            "4. Audit git commit history and CI/CD pipelines to ensure secrets are never stored inside web-accessible roots."
        ),
        "actions": [
            "1. Web Server Hardening (NGINX):\n   location ~ /\\.(?!well-known) {\n       deny all;\n       return 404;\n   }",
            "2. Web Server Hardening (Apache HTTP Server):\n   <FilesMatch \"^\\.\">\n       Require all denied\n   </FilesMatch>",
            "3. Cloudflare WAF / Edge Rule:\n   Create a WAF Custom Rule: (http.request.uri.path contains \"/.env\") -> Action: Block (403)",
            "4. Immediate Key Invalidation & Rotation:\n   Invalidate and rotate every database password, JWT signing secret, and third-party API token exposed in the file.",
            "5. Emergency Search Engine Cache Purge:\n   Submit an emergency URL removal request via Google Search Console (URL Inspection -> Removals) to flush cached snippets."
        ],
        "default_directive": "Block access to dotfiles in NGINX ('location ~ /\\.(?!well-known) { deny all; return 404; }') and rotate all exposed database credentials immediately."
    },
    "TOKEN_LEAK": {
        "title": "Exposed Cloud API Secret / Access Token Signature",
        "severity": "CRITICAL",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N (9.6 Critical)",
        "owasp_tag": "OWASP A07:2021 — Identification and Authentication Failures",
        "cwe_id": "CWE-798: Use of Hard-coded Credentials",
        "what_is_the_bug": (
            "A high-entropy, live cryptographic API key or cloud provider access token signature "
            "(e.g. AWS Access Key ID 'AKIA...', Google API Key 'AIzaSy...', Stripe Secret Key 'sk_live_...', or GitHub PAT 'ghp_...') "
            "is indexed in public client-side JavaScript bundles, public repositories, or search engine snippets."
        ),
        "why_it_is_a_bug": (
            "Unlike public client identifiers, secret API tokens grant programmatic access directly to backend APIs and cloud services. "
            "An exposed AWS access key allows adversaries to provision expensive EC2 compute instances for cryptomining, exfiltrate private S3 buckets, "
            "or delete production backups. An exposed Stripe live secret key allows attackers to issue fraudulent refunds, charge customers, and view PII. "
            "Search engines index these tokens indefinitely until emergency revocation and cache flushes occur."
        ),
        "attack_vector": (
            "1. Automated Secret Harvesting: Adversary runs continuous automated scrapers looking for high-entropy regex patterns (e.g. AKIA[0-9A-Z]{16}).\n"
            "2. Cloud Provider Authentication: Attacker executes 'aws sts get-caller-identity' or 'curl -H \"Authorization: Bearer <token>\"' to verify privileges.\n"
            "3. Resource Hijacking & Data Exfiltration: Attacker accesses private object stores, creates rogue IAM users, or drains corporate API credit balances."
        ),
        "how_to_fix": (
            "1. Immediately deactivate and delete the exposed key in the provider management console.\n"
            "2. Generate a new key and configure it exclusively through backend environment variables or secrets managers (e.g. AWS Secrets Manager, HashiCorp Vault).\n"
            "3. Inspect provider audit logs (AWS CloudTrail, GitHub Audit Log, Stripe Dashboard) for unauthorized operations during the exposure window.\n"
            "4. Refactor client-side code to proxy API calls through an authenticated backend instead of embedding secrets in browser JavaScript bundles."
        ),
        "actions": [
            "1. Emergency Token Invalidation (AWS IAM CLI):\n   aws iam update-access-key --access-key-id <EXPOSED_KEY_ID> --status Inactive",
            "2. Access Log Audit (AWS CloudTrail):\n   aws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=<EXPOSED_KEY_ID>",
            "3. Architecture Refactoring:\n   Never embed backend API secrets in frontend React/Next.js/Vue bundles. Proxy all requests through backend /api/ endpoints.",
            "4. Pre-commit Hook Enforcement:\n   Deploy pre-commit secret scanners (TruffleHog / Gitleaks) across all developer workstations to prevent future leaks."
        ],
        "default_directive": "Immediately deactivate exposed key in cloud provider console (AWS IAM / Stripe / Google Cloud), audit audit logs, and proxy third-party calls through backend."
    },
    "DOCUMENT_LEAK": {
        "title": "Exposed Confidential Corporate Document (PDF/XLSX/DOCX)",
        "severity": "HIGH",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N (7.5 High)",
        "owasp_tag": "OWASP A01:2021 — Broken Access Control",
        "cwe_id": "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor",
        "what_is_the_bug": (
            "An internal corporate document (PDF spreadsheet, financial report, employee roster, or legal agreement) "
            "marked as 'CONFIDENTIAL', 'INTERNAL ONLY', or 'PROPRIETARY' is hosted on a publicly reachable web path "
            "without authentication and has been indexed by public search crawlers."
        ),
        "why_it_is_a_bug": (
            "Confidential corporate documents can reveal trade secrets, unreleased financial projections, customer PII, "
            "internal network architecture diagrams, and executive strategy. Public indexing exposes the organization to "
            "regulatory compliance fines (GDPR, HIPAA, SEC disclosure violations), corporate espionage, and targeted spear-phishing campaigns."
        ),
        "attack_vector": (
            "1. Search Dorking: Attacker queries 'site:target.com filetype:pdf \"CONFIDENTIAL\"'.\n"
            "2. Document Exfiltration: Attacker downloads internal spreadsheets and PDFs directly via public HTTP links.\n"
            "3. Targeted Social Engineering / Intelligence Gathering: Extracted employee names, internal emails, and financial data are used for targeted executive impersonation."
        ),
        "how_to_fix": (
            "1. Remove the document from the public web server directory or place it behind corporate Single Sign-On (SSO).\n"
            "2. Add 'X-Robots-Tag: noindex, noarchive' HTTP response header to prevent indexing.\n"
            "3. Submit an urgent URL deletion request via Google Search Console Removals tool."
        ),
        "actions": [
            "1. Web Server Header Injection (NGINX):\n   location ~* \\.(pdf|xlsx|docx)$ {\n       add_header X-Robots-Tag \"noindex, nofollow, noarchive\" always;\n   }",
            "2. Enforce Authentication:\n   Require corporate SSO (OAuth2 / SAML) for all document repository paths (/internal/, /docs/confidential/).",
            "3. Google Search Console Removal:\n   Go to Google Search Console -> Indexing -> Removals -> Submit New Temporary Removal Request for the exposed URL."
        ],
        "default_directive": "Remove file from public web root or enforce SSO. Add 'X-Robots-Tag: noindex' and request immediate Google Search Console URL removal."
    },
    "GITHUB_LEAK": {
        "title": "Public GitHub Repository Credential / Source Code Exposure",
        "severity": "CRITICAL",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N (9.6 Critical)",
        "owasp_tag": "OWASP A07:2021 — Identification and Authentication Failures",
        "cwe_id": "CWE-312: Cleartext Storage of Sensitive Information",
        "what_is_the_bug": (
            "Developers or contractors accidentally committed private credentials, API keys, database credentials, "
            "or private RSA/SSH keys to a public GitHub repository belonging to or referencing the organization."
        ),
        "why_it_is_a_bug": (
            "GitHub is continuously indexed by threat actor botnets and public search engines. Once committed, credentials "
            "remain permanently in the git revision history even if deleted in a subsequent commit. Attackers harvest these "
            "within seconds to breach infrastructure, access private repositories, and clone proprietary IP."
        ),
        "attack_vector": (
            "1. Public Git Scraping: Automated bots monitor the GitHub Events API and search dorks for sensitive filenames (.env, id_rsa).\n"
            "2. Historical Extraction: Attacker inspects older git commits ('git log -p') to retrieve secrets committed in earlier versions.\n"
            "3. Production Compromise: Extracted keys are utilized to access production staging servers or cloud infrastructure."
        ),
        "how_to_fix": (
            "1. Consider every secret found in git history to be compromised — rotate all exposed keys and passwords immediately.\n"
            "2. Purge the sensitive file from all git branches and historical commits using 'git-filter-repo' or BFG Repo-Cleaner.\n"
            "3. Force push the cleaned repository and ensure the repository is made private if it contains proprietary source code.\n"
            "4. Enforce automated pre-commit hooks and GitHub secret scanning alerts."
        ),
        "actions": [
            "1. Immediate Key Revocation:\n   Revoke every API key, SSH private key, or password found in the repository in its respective provider console.",
            "2. Rewrite Git Commit History:\n   git filter-repo --invert-paths --path <LEAKED_FILE_PATH> --force\n   git push origin --force --all",
            "3. Enable GitHub Secret Scanning:\n   In Repository Settings -> Code security and analysis -> Enable 'Secret scanning' and 'Push protection'.",
            "4. Workstation Pre-commit Hook:\n   Install TruffleHog (brew install trufflehog) and configure pre-commit hooks in .git/hooks/pre-commit."
        ],
        "default_directive": "Immediately revoke key in cloud console. Rewrite commit history using 'git-filter-repo'. Deploy pre-commit secret hooks."
    },
    "S3_LEAK": {
        "title": "Publicly Accessible Cloud Storage Bucket (AWS S3 / GCS)",
        "severity": "HIGH",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N (8.2 High)",
        "owasp_tag": "OWASP A01:2021 — Broken Access Control",
        "cwe_id": "CWE-552: Files or Directories Accessible to External Parties",
        "what_is_the_bug": (
            "A cloud object storage bucket (AWS S3 bucket or Google Cloud Storage bucket) belonging to the organization "
            "has misconfigured permissions (public read ACL or bucket policy) allowing unauthenticated users to list and download files."
        ),
        "why_it_is_a_bug": (
            "Open cloud storage buckets are one of the most common causes of massive enterprise data breaches. "
            "When public read permissions are enabled, threat actors can download customer records, database backups, logs, "
            "and sensitive assets en masse. If public write permissions are misconfigured, attackers can tamper with assets or host malware."
        ),
        "attack_vector": (
            "1. Bucket Enumeration: Attacker discovers bucket names via search engine dorking or brute-force tools (e.g. aws s3 ls s3://<bucket>).\n"
            "2. Mass File Harvesting: Attacker executes 'aws s3 sync s3://<bucket> ./dump' to download entire corporate data archives.\n"
            "3. Ransomware / Extortion: Attacker exfiltrates confidential client databases and demands ransom for non-disclosure."
        ),
        "how_to_fix": (
            "1. Enable AWS S3 'Block Public Access' across the bucket and account level.\n"
            "2. Audit bucket ACLs and policies to remove 'AllUsers' and 'AuthenticatedUsers' grants.\n"
            "3. Switch to short-lived cryptographically signed Pre-Signed URLs for legitimate asset distribution."
        ),
        "actions": [
            "1. AWS CLI Enable Block Public Access:\n   aws s3api put-public-access-block --bucket <BUCKET_NAME> \\\n     --public-access-block-configuration \"BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true\"",
            "2. Audit Bucket ACL Permissions:\n   aws s3api get-bucket-acl --bucket <BUCKET_NAME>",
            "3. Replace Public Links With Pre-Signed URLs:\n   Use AWS SDK to generate presigned URLs with short TTL (e.g. 15 minutes) for authorized downloads."
        ],
        "default_directive": "Enable AWS S3 'Block Public Access' at account root. Audit bucket ACLs and replace public links with short-lived Pre-Signed URLs."
    },
    "API_DOCS": {
        "title": "Public Interactive API Documentation (Swagger / GraphQL / OpenAPI)",
        "severity": "MEDIUM",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (5.3 Medium)",
        "owasp_tag": "OWASP A01:2021 — Broken Access Control",
        "cwe_id": "CWE-215: Insertion of Sensitive Information into Debugging Code",
        "what_is_the_bug": (
            "Interactive API documentation endpoints (such as /swagger-ui, /openapi.json, /docs, or GraphQL /graphql with introspection enabled) "
            "are exposed publicly without requiring developer authentication or network allowlisting."
        ),
        "why_it_is_a_bug": (
            "While API documentation is necessary for developers, public interactive consoles expose internal microservice routes, "
            "deprecated parameters, administrative mutation endpoints, data models, and unauthenticated routes. Automated vulnerability "
            "scanners ingest OpenAPI specifications to systematically fuzz every endpoint for authorization bypasses (BOLA/IDOR) and injection flaws."
        ),
        "attack_vector": (
            "1. Route Mapping: Attacker queries OpenAPI schema (/openapi.json) to discover all internal endpoints, schemas, and parameters.\n"
            "2. Automated Fuzzing: Attacker runs tools like Postman, Burp Suite, or OWASP ZAP to test hidden admin routes and test accounts.\n"
            "3. Exploitation: Attacker identifies unprotected endpoints (e.g. /api/v1/users/{id} without authorization checks)."
        ),
        "how_to_fix": (
            "1. Place interactive API documentation behind corporate OAuth2, HTTP Basic Auth, or VPN allowlists in production.\n"
            "2. Disable GraphQL schema introspection in production deployments.\n"
            "3. Add 'X-Robots-Tag: noindex, nofollow' response header to prevent indexing."
        ),
        "actions": [
            "1. NGINX Reverse Proxy Basic Authentication:\n   location /docs {\n       auth_basic \"Internal Developer Portal\";\n       auth_basic_user_file /etc/nginx/.htpasswd;\n   }",
            "2. Disable Production GraphQL Introspection (Node.js Apollo / Python Strawberry):\n   ApolloServer({ introspection: process.env.NODE_ENV !== 'production' })",
            "3. Prevent Search Crawler Indexing:\n   location /swagger-ui {\n       add_header X-Robots-Tag \"noindex, nofollow, noarchive\" always;\n   }"
        ],
        "default_directive": "Place API documentation routes behind an authenticated gateway or corporate VPN. Inject 'X-Robots-Tag: noindex, nofollow' response header."
    },
    "INFRASTRUCTURE": {
        "title": "Public Authentication Gateway / Admin Access Portal",
        "severity": "LOW",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (3.7 Low)",
        "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
        "cwe_id": "CWE-1004: Sensitive Cookie Without 'HttpOnly' Flag",
        "what_is_the_bug": (
            "A corporate login portal, single sign-on authentication gateway, staging subdomain, or administrative dashboard "
            "is exposed on the public Internet without IP boundary restrictions."
        ),
        "why_it_is_a_bug": (
            "Public login portals provide a direct attack surface for automated password spraying, credential stuffing attacks, "
            "and targeted phishing. If pre-production staging portals are exposed, they often run outdated code with debugging flags enabled."
        ),
        "attack_vector": (
            "1. Subdomain Enumeration: Attacker locates auth portals via DNS and search dorking (e.g. login.target.com, admin.target.com).\n"
            "2. Credential Stuffing: Attacker replays leaked password dumps against the authentication endpoint.\n"
            "3. MFA Fatigue / Bypass: Attacker floods corporate users with push notifications to achieve unauthorized access."
        ),
        "how_to_fix": (
            "1. Restrict administrative portals via corporate VPN, Cloudflare Zero Trust Access, or IP allowlisting.\n"
            "2. Enforce phishing-resistant Multi-Factor Authentication (FIDO2 / WebAuthn) on all user accounts.\n"
            "3. Implement aggressive rate limiting and adaptive account lockout policies."
        ),
        "actions": [
            "1. Cloudflare Zero Trust / Access Policy:\n   Enforce Zero Trust Access application policy requiring Okta / Google Workspace SSO + Device Posture check.",
            "2. NGINX IP Allowlisting for Admin Routes:\n   location /admin {\n       allow 198.51.100.0/24; # Corporate VPN IP range\n       deny all;\n   }",
            "3. Rate Limiting Rule:\n   limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;"
        ],
        "default_directive": "Enforce corporate SSO or IP allowlisting on pre-production subdomains. Audit DNS to avoid dangling CNAME takeover."
    },
    "YOUTUBE_POC": {
        "title": "Public Exploit & Bug Bounty Disclosure Video",
        "severity": "INFO",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N (0.0 Informational)",
        "owasp_tag": "OWASP Threat Intelligence — Public Exploit Radar",
        "cwe_id": "CWE-699: Software Development Security Advisory",
        "what_is_the_bug": (
            "A security researcher or bug bounty hunter has published a video demonstration detailing a proof-of-concept "
            "exploit, vulnerability writeup, or penetration testing scenario referencing the target brand or software ecosystem."
        ),
        "why_it_is_a_bug": (
            "This item is an OSINT Threat Intelligence Advisory, not an active server vulnerability on your perimeter. "
            "Public exploit videos often reveal exact payload techniques, vulnerable endpoint logic, and reproduction steps. "
            "If your production systems are running unpatched versions of the demonstrated component, adversaries can replicate the exploit."
        ),
        "attack_vector": (
            "1. Public Video Analysis: Threat actors monitor YouTube and security blogs for newly published bug bounty writeups.\n"
            "2. Payload Replication: Attackers copy demonstrated payload syntax (e.g. SQL injection, SSRF, or authentication bypass).\n"
            "3. Mass Exploitation: Attackers target organizations deploying the affected software version before patches are applied."
        ),
        "how_to_fix": (
            "1. Review the researcher video to determine the specific component, library version, or API endpoint discussed.\n"
            "2. Cross-reference internal release logs to confirm whether the demonstrated vulnerability is patched in production.\n"
            "3. Reach out to the researcher for coordinated disclosure if an unpatched 0-day is demonstrated."
        ),
        "actions": [
            "1. Vulnerability Assessment: Verify if your current production build uses the affected software version or dependency.\n",
            "2. Patch Management: Update affected open-source components or web framework libraries to the latest stable release.\n",
            "3. Security Advisory Logging: File an internal ticket with your SecOps team documenting the advisory review."
        ],
        "default_directive": "Threat Intel PoC Radar: Review researcher video to verify if demonstrated exploit vector has been patched in your current deployment."
    },
    "NEWS_BREACH": {
        "title": "External Cybersecurity News & Threat Intelligence",
        "severity": "INFO",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N (0.0 Informational)",
        "owasp_tag": "OWASP Threat Intelligence — External Advisory",
        "cwe_id": "CWE-699: Software Development Security Advisory",
        "what_is_the_bug": (
            "A public cybersecurity research article, security bulletin, or threat intelligence news report "
            "referencing the organization's technology ecosystem or past security disclosures."
        ),
        "why_it_is_a_bug": (
            "This is external OSINT threat intelligence, not a server misconfiguration on your live perimeter. "
            "Threat research articles provide vital context regarding active threat actor campaigns, industry-wide CVE disclosures, "
            "and evolving attack methodologies targeting your sector."
        ),
        "attack_vector": (
            "1. Threat Actor Campaign: Threat groups leverage publicly disclosed vulnerabilities targeting industry software stacks.\n"
            "2. Reconnaissance: Attackers verify whether organizations in the sector have applied the recommended mitigations."
        ),
        "how_to_fix": (
            "1. Review the referenced research to evaluate whether your defensive posture satisfies defense-in-depth requirements.\n"
            "2. No immediate perimeter action required unless your infrastructure runs the vulnerable component."
        ),
        "actions": [
            "1. Intelligence Review: Circulate the advisory with your internal incident response and security engineering teams.\n",
            "2. Perimeter Verification: Verify WAF rules and intrusion detection signatures are active for the mentioned CVE."
        ],
        "default_directive": "Informational OSINT Advisory: Review the referenced research to ensure defense-in-depth posture. No server-side vulnerability detected on target domain."
    },
    "MOBILE_APP": {
        "title": "Official Mobile Application Perimeter Asset",
        "severity": "INFO",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N (0.0 Informational)",
        "owasp_tag": "OWASP Mobile Top 10 (M1-M10)",
        "cwe_id": "CWE-699: Mobile Application Security",
        "what_is_the_bug": (
            "An official Android or iOS mobile application published in the Google Play Store or Apple App Store, "
            "representing an external client perimeter that interfaces with corporate backend APIs."
        ),
        "why_it_is_a_bug": (
            "Mobile applications are compiled client binaries distributed to untrusted devices. Reverse engineers and attackers "
            "decompile APK/IPA packages using tools like Jadx and Frida to locate hardcoded API keys, undocumented endpoints, "
            "and insecure cryptographic storage. The mobile client represents an external vector into your backend APIs."
        ),
        "attack_vector": (
            "1. APK Decompilation: Attacker downloads the APK and decompiles bytecode with Jadx / apktool.\n"
            "2. Static Secret Extraction: Attacker searches strings.xml and decompiled Java for hardcoded API keys or staging URLs.\n"
            "3. Man-in-the-Middle (MitM) Interception: Attacker hooks network calls using Frida to intercept unpinned SSL traffic."
        ),
        "how_to_fix": (
            "1. Implement SSL certificate pinning to protect mobile client communications against MitM interception.\n"
            "2. Enable bytecode obfuscation (ProGuard / R8) and remove all backend secrets and test endpoints from production builds.\n"
            "3. Enforce strict OAuth2 token authentication and API rate limiting on mobile backend gateways."
        ),
        "actions": [
            "1. SSL Pinning Enforcement: Implement Network Security Config in Android (network_security_config.xml) with certificate pin sets.\n",
            "2. ProGuard / R8 Obfuscation: Ensure minifyEnabled true and shrinkResources true in build.gradle.\n",
            "3. API Gateway Authentication: Never trust client parameters; validate JWT signatures on all backend endpoints."
        ],
    },
    "RESOURCE": {
        "title": "OSINT Intelligence & Community Research Resource",
        "severity": "INFO",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N (0.0 Informational)",
        "owasp_tag": "OSINT / Security Intelligence",
        "cwe_id": "CWE-200: Information Exposure (Benign / Informational)",
        "what_is_the_bug": "Security research publication, bug bounty methodology guide, or public OSINT resource.",
        "why_it_is_a_bug": "Discovered during external perimeter OSINT sweeping. Provides situational awareness for security engineering teams regarding community research and public methodologies.",
        "attack_vector": "Publicly indexed educational and technical resources available via Google, YouTube, and GitHub.",
        "how_to_fix": "No remediation required. Review resource for threat modeling awareness and defensive posture tuning.",
        "actions": [
            "1. Review resource context for internal threat modeling and purple-team exercises.",
            "2. Ensure internal defensive playbooks address any documented methodologies."
        ],
        "default_directive": "Informational Research Resource: No remediation required. Retained for threat intelligence context."
    },
    "MISSING_SECURITY_HEADERS": {
        "title": "Missing Fundamental HTTP Security Headers (CSP / HSTS / Anti-Clickjacking)",
        "severity": "HIGH",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:L/A:N (7.5 High)",
        "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
        "cwe_id": "CWE-1021: Improper Restriction of Rendered UI Layers or Frames",
        "what_is_the_bug": "Web server responses lack essential browser security headers including Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), or X-Frame-Options.",
        "why_it_is_a_bug": "Security headers instruct modern browsers to enforce strict sandboxing, prevent cross-site scripting (XSS), stop Clickjacking UI overlays, and reject insecure HTTP downgrade attempts.",
        "attack_vector": "1. Adversary embeds application inside a transparent iframe for Clickjacking.\n2. Injected scripts execute without CSP restrictions to harvest user tokens.\n3. Adversary performs SSL-stripping on unsecured network hops.",
        "how_to_fix": "Configure reverse proxy or web server (NGINX, Cloudflare, Apache) to inject strict CSP, HSTS, and frame-ancestors headers on all responses.",
        "actions": [
            "1. NGINX Configuration:\n   add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';\" always;\n   add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\" always;\n   add_header X-Frame-Options \"SAMEORIGIN\" always;\n   add_header X-Content-Type-Options \"nosniff\" always;",
            "2. Cloudflare Transform Rules: Enforce security response headers at edge CDN.",
            "3. Next.js headers() config: Add security headers array in next.config.js."
        ],
        "default_directive": "Inject Content-Security-Policy, HSTS (max-age=63072000), and X-Frame-Options: SAMEORIGIN at the web server/reverse proxy layer."
    },
    "EMAIL_SECURITY": {
        "title": "Domain Email Spoofing Vulnerability (Missing / Weak DMARC Record)",
        "severity": "HIGH",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N (7.5 High)",
        "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
        "cwe_id": "CWE-358: Foundational Security Check Bypass (Domain Spoofing)",
        "what_is_the_bug": "The domain lacks a strict DMARC (Domain-based Message Authentication) policy or has policy 'p=none', enabling unauthorized senders to forge email headers.",
        "why_it_is_a_bug": "Without DMARC enforcement (p=reject or p=quarantine), threat actors can deploy rogue mail servers and send phishing emails appearing to originate directly from legitimate corporate addresses (@target.com).",
        "attack_vector": "Adversary sends fraudulent invoices, credential harvest links, or CEO fraud communications to employees and customers. Receiving mail providers deliver the spoofed emails because no rejecting DMARC policy exists.",
        "how_to_fix": "Publish a DNS TXT record under '_dmarc.target.com' specifying 'v=DMARC1; p=reject;'.",
        "actions": [
            "1. Publish DNS TXT record at _dmarc.<target>: 'v=DMARC1; p=reject; sp=reject; rua=mailto:dmarc-reports@<target>; pct=100;'",
            "2. Ensure SPF record (v=spf1) lists all authorized sender IPs and ends with '~all' or '-all'.",
            "3. Configure DKIM cryptographic signing on all outbound mail servers."
        ],
        "default_directive": "Publish DNS TXT record '_dmarc.<target>' with policy 'v=DMARC1; p=reject;' to prevent domain spoofing and phishing."
    },
    "DNS_CAA_MISSING": {
        "title": "Missing DNS CAA Record (Unrestricted Certificate Authority Issuance)",
        "severity": "LOW",
        "cvss_score": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N (4.8 Low)",
        "owasp_tag": "OWASP A05:2021 — Security Misconfiguration",
        "cwe_id": "CWE-295: Improper Certificate Validation",
        "what_is_the_bug": "The domain does not restrict which Certificate Authorities (CAs) can issue SSL/TLS certificates via DNS CAA records.",
        "why_it_is_a_bug": "Any compromised or rogue public CA globally can issue valid certificates for the domain, enabling invisible Man-in-the-Middle (MitM) attacks.",
        "attack_vector": "Attacker coerces or compromises a regional CA to issue an unauthorized certificate for target.com without owner approval.",
        "how_to_fix": "Add CAA DNS records explicitly listing approved CAs (e.g. letsencrypt.org, pki.goog, digicert.com).",
        "actions": [
            "1. Add DNS record: <target> CAA 0 issue \"letsencrypt.org\"",
            "2. Add DNS record: <target> CAA 0 issue \"pki.goog\"",
            "3. Add DNS record: <target> CAA 0 iodef \"mailto:security@<target>\""
        ],
        "default_directive": "Add DNS CAA records restricting SSL certificate issuance to approved CAs."
    },
    "EXPOSED_API_SCHEMA": {
        "title": "Exposed Interactive OpenAPI / Swagger Schema Blueprint",
        "severity": "MEDIUM",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (5.3 Medium)",
        "owasp_tag": "OWASP API9:2023 — Improper Inventory Management",
        "cwe_id": "CWE-215: Insertion of Sensitive Information into Debugging Code",
        "what_is_the_bug": "An interactive API documentation schema (/openapi.json, /swagger.json) is accessible on the public Internet without developer authentication.",
        "why_it_is_a_bug": "Machine-readable schemas enumerate all backend endpoints, object models, authentication headers, and administrative routes, giving adversaries a complete blueprint for automated vulnerability fuzzing.",
        "attack_vector": "Adversary downloads /openapi.json into automated fuzzers (Burp Suite, Postman, Nuclei) to locate authorization flaws (BOLA/IDOR) on unlisted endpoints.",
        "how_to_fix": "Restrict API schema endpoints to authenticated developers or corporate internal VPNs.",
        "actions": [
            "1. Enforce OAuth2 / Basic Auth on /openapi.json and /docs routes in production.",
            "2. Add 'X-Robots-Tag: noindex, nofollow' header to prevent crawler indexing."
        ],
        "default_directive": "Restrict API documentation schema to authenticated developer sessions."
    },
    "DISALLOWED_ENDPOINT": {
        "title": "Sensitive Endpoint Enumerated in Robots Policy",
        "severity": "LOW",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (3.7 Low)",
        "owasp_tag": "OWASP A01:2021 — Broken Access Control",
        "cwe_id": "CWE-200: Exposure of Sensitive Information",
        "what_is_the_bug": "Robots.txt discloses internal routes, administrative paths, or private API endpoints to search crawlers and threat actors.",
        "why_it_is_a_bug": "Adversaries analyze robots.txt to discover hidden application surface. Disallow directives do not provide security and actually reveal sensitive locations.",
        "attack_vector": "Attacker inspects /robots.txt, discovers disallowed paths (e.g. /api/private, /auth/), and attempts direct unauthenticated access.",
        "how_to_fix": "Ensure all sensitive endpoints enforce cryptographic authentication and remove unneeded internal path listings from robots.txt.",
        "actions": [
            "1. Enforce strict JWT/Session verification on all disallowed paths.",
            "2. Do not list secret internal paths in public robots.txt files."
        ],
        "default_directive": "Enforce authentication on all disallowed paths; do not rely on robots.txt for security."
    },
    "BRAND_PRESENCE": {
        "title": "External Ecosystem & Brand Digital Footprint",
        "severity": "INFO",
        "cvss_score": "0.0 (Informational)",
        "owasp_tag": "OSINT / Attack Surface Intelligence",
        "cwe_id": "CWE-200: Information Exposure (Informational)",
        "what_is_the_bug": "Discovered external brand footprint across third-party directories, tool registries, and technology listings.",
        "why_it_is_a_bug": "External digital footprints provide valuable threat intelligence regarding brand exposure, third-party integrations, and user sentiment across the public web.",
        "attack_vector": "Adversaries map external directories and integrations to identify supply chain dependencies and impersonation targets.",
        "how_to_fix": "Maintain periodic reviews of brand mentions and ensure third-party directory listings point to authenticated official domains.",
        "actions": [
            "1. Monitor third-party directories and reviews for brand consistency.",
            "2. Ensure all external links enforce HTTPS."
        ],
        "default_directive": "Informational digital footprint asset. Retained for external attack surface awareness."
    },
    "GITHUB_REPO": {
        "title": "Public Open Source Repository & Integration Code",
        "severity": "LOW",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (3.1 Low)",
        "owasp_tag": "OSINT / Supply Chain Intelligence",
        "cwe_id": "CWE-200: Information Exposure",
        "what_is_the_bug": "Public GitHub repository referencing the brand, developer tooling, or third-party client integrations.",
        "why_it_is_a_bug": "Public repositories can reveal client implementations, API usage patterns, and open-source tooling. If developers inadvertently commit tokens or internal architecture details, repositories become entry points for adversaries.",
        "attack_vector": "Attacker reviews public source code, commit history, and issue discussions to discover undocumented API parameters or developer email addresses.",
        "how_to_fix": "Audit public repositories for secret hygiene and enforce branch protection policies.",
        "actions": [
            "1. Run TruffleHog / GitGuardian secret scanners on all public repositories.",
            "2. Enforce GitHub secret scanning and push protection."
        ],
        "default_directive": "Audit public repository for hardcoded secrets and enforce pre-commit secret scanners."
    }
}

def get_remediation_for_category(category: str) -> Dict[str, Any]:
    cat = category.upper()
    if cat in REMEDIATION_PLAYBOOKS:
        return REMEDIATION_PLAYBOOKS[cat]
    return {
        "title": "Perimeter Security Finding",
        "severity": "INFO",
        "cvss_score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N (0.0 Informational)",
        "owasp_tag": "OWASP Security Verification",
        "cwe_id": "CWE-200: Exposure of Information",
        "what_is_the_bug": f"Discovered perimeter asset classified under {category}.",
        "why_it_is_a_bug": "Review asset exposure to confirm principle of least privilege and verify that only intended endpoints are reachable.",
        "attack_vector": "Adversary performs standard external asset enumeration to discover exposed perimeter interfaces.",
        "how_to_fix": "Verify that this endpoint is intended for public consumption and enforce network perimeter controls.",
        "actions": ["1. Review access control policies and restrict endpoint to authorized networks if not public."],
        "default_directive": "Review asset exposure and restrict to authorized network boundaries."
    }
