# 🛡️ ReconFlow AI
### Autonomous External Attack Surface Management & Threat Intelligence Agent
**Track Selection:** Track 01 — AI Agents (SerpApi MCP Native)  
**Hackathon:** SerpApi India Hackathon 2026 · Target Deadline: October 5, 2026, 23:59 IST  
**Cost to Run:** $0 / ₹0 (Operates 100% within SerpApi Free Tier + Localhost)

---

## 📌 Executive Summary
Engineering teams deploy microservices, cloud storage, and staging clusters faster than internal security operations can catalog them. This speed inevitably creates **Shadow IT**: forgotten staging subdomains, unauthenticated API documentation portals (`/swagger-ui`, `/graphiql`), and misconfigured web roots exposing `.env` files or database dumps to public search engine crawlers.

Security analysts know search engines continuously index these assets. The defensive standard to detect them is **Google Dorking**. However:
1. **Aggressive Bot Defenses:** Google triggers bot blocks, CAPTCHAs, and IP rate-limits after 3–5 rapid automated requests.
2. **Scattered Output:** Legacy scripts dump raw terminal text or CSV logs that lack hierarchical relationship context.
3. **No Remediation Context:** Flagging a vulnerability without providing the exact web server directive or cloud policy leaves the organization exposed.

**ReconFlow AI bridges this gap by converting SerpApi into an autonomous, defensive EASM agent.** Given an enterprise target domain, ReconFlow uses SerpApi's proxy infrastructure and `serpapi-search-tools` to execute a multi-pass reconnaissance sweep, eliminates false positives, categorizes risks under OWASP standards, and maps the entire attack perimeter onto an **interactive, color-coded node graph with copy-paste defensive remediation playbooks**.

---

## 🏆 Hackathon Strategy & Competitive Differentiation

An audit of all **177 projects** in the `#BuiltWithSerpApi` showcase demonstrates that ReconFlow occupies an uncontested niche:

| Showcase Category | Existing Apps | ReconFlow AI Difference |
| :--- | :--- | :--- |
| **Brand Protection** | `CeaseFire`, `typo.watch` | They monitor external fraudsters spoofing brands (e.g., `paypa1.com`). ReconFlow looks **inward** at an organization's own legitimate infrastructure to find what developers accidentally left exposed. |
| **Document/Invoice** | `Signet`, `CounterSign` | Business invoice and signature verification. Zero infrastructure or attack surface mapping. |
| **CVE News Readers** | `Grid Guardian Intel` | Passive news aggregator. Does not audit real, live indexed web assets or subdomains. |
| **Visual Evidence** | `SybilWatch`, `FaceChain` | Reverse photo searches for faces on blockchain. Zero cyber infrastructure. |

---

## 🛠️ Judge-Aligned Tooling & Architecture
ReconFlow AI directly adopts the tools officially recommended by SerpApi Developer Advocates (**Adarsh Divakaran** and **Tomas Murua**):
* **`serpapi-search-tools`**: SerpApi's official Python package for AI agent tools.
* **SerpApi MCP Server**: Integrates with the official Model Context Protocol server (`https://mcp.serpapi.com/`).
* **Multi-Engine Intelligence**: Cross-engine perimeter verification using `google`, `google_light`, and `bing`, plus `google_news` for live threat intel.

```
                              [ TARGET: target.com ]
                                         │
                                         ▼
                         [ RECONFLOW ORCHESTRATION AGENT ]
                   (FastAPI + serpapi-search-tools / SerpApi MCP)
                                         │
           ┌─────────────────────────────┴─────────────────────────────┐
           ▼                                                           ▼
 ╔═══════════════════════════════════════╗   ╔═══════════════════════════════════════╗
 ║        PHASE 1: INTERNAL DOMAIN       ║   ║     PHASE 2: THIRD-PARTY & SHADOW     ║
 ║           Scope: *.target.com         ║   ║        Scope: External Ecosystem      ║
 ╠═══════════════════════════════════════╣   ╠═══════════════════════════════════════╣
 ║ • Subdomains & Unmapped Hosts         ║   ║ • Indexed GitHub Source Code Secrets  ║
 ║ • Interactive API Docs (/swagger-ui)  ║   ║ • Misconfigured Public Cloud Buckets  ║
 ║ • Leaked Dotfiles (.env, .sql, .yaml) ║   ║ • Public Credential Pastes & Dumps    ║
 ╚═══════════════════════════════════════╝   ╚═══════════════════════════════════════╝
           │                                                           │
           └─────────────────────────────┬─────────────────────────────┘
                                         │
                                         ▼
                     [ TRIAGE, SCORING & DEDUPLICATION ]
                      - FQDN Normalization & Pruning
                      - OWASP / CWE Classification
                      - Actionable Remediation Directives
                                         │
                                         ▼
                     [ DUAL-MODE VISUAL DELIVERABLE ]
                      1. Dynamic React Flow Attack Canvas
                      2. One-Click Executive Audit Report
```

---

## 🔍 Resilient Dorking Matrix

### Phase 1: Internal Perimeter (Domain-Only)
* **Pass 1.1: Subdomain Harvesting**
  * *Primary Query:* `site:*.{target} -www.{target}`
  * *Engine:* `google` + `bing` cross-validation
  * *Severity:* `INFO` / `LOW`
* **Pass 1.2: Unauthenticated API Documentation Gateways**
  * *Primary Query:* `site:{target} (inurl:swagger-ui OR inurl:graphiql OR inurl:api-docs OR inurl:redoc)`
  * *Severity:* `MEDIUM` (OWASP A01:2021 / CWE-215)
* **Pass 1.3: Sensitive Configuration Files & Database Dumps**
  * *Primary Query:* `site:{target} (filetype:env OR filetype:sql OR filetype:yaml OR filetype:log OR intitle:"index of /")`
  * *Severity:* `CRITICAL` (OWASP A05:2021 / CWE-200)

### Phase 2: Third-Party & Shadow IT Expansion
* **Pass 2.1: Public Code Repository Leaks (GitHub)**
  * *Query:* `site:github.com "{target}" ("BEGIN RSA PRIVATE KEY" OR "api_key" OR "DB_PASSWORD")`
  * *Severity:* `CRITICAL` (OWASP A07:2021 / CWE-312)
* **Pass 2.2: Misconfigured Cloud Storage (AWS S3 & GCS)**
  * *Query:* `(site:s3.amazonaws.com OR site:storage.googleapis.com) "{target}" (filetype:sql OR filetype:env OR filetype:xlsx)`
  * *Severity:* `HIGH` (OWASP A01:2021 / CWE-552)

---

## ⚡ 60-Second Quickstart (Localhost)

### 1. Prerequisites
* Python 3.9+
* Node.js 18+ (tested on Node v20/v22/v25)

### 2. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env    # Optionally add your SERPAPI_KEY
uvicorn app.main:app --reload --port 8000
```
Verify: Visit `http://localhost:8000/health` $\rightarrow$ `{"status": "ok"}`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Verify: Open `http://localhost:3000` in your browser.

---

## 🛡️ Zero-Cost ($0) Development & Benchmark Mode
ReconFlow features a built-in filesystem caching layer (`backend/cache/{domain}.json`):
* Click **"Benchmark Demo"** in the UI to instantly load `demo-sandbox.corp` from cache.
* Allows frontend styling, zoom/pan testing, and video rehearsal with **0 SerpApi credit burn**.
* Live scans use only **3 to 4 SerpApi queries**, allowing 60–80 full enterprise scans within SerpApi's free tier (250 searches/month).

---

## 👥 Two-Developer Team Division
* **Developer A (Backend Lead):** FastAPI service, `serpapi-search-tools`, MCP client, caching layer, severity triage, and remediation engine.
* **Developer B (Frontend Lead):** Next.js 14, React Flow canvas, custom severity-styled nodes, slide-out remediation drawer, and 1-click Markdown export.

---

## 📄 License
MIT License. Built for the SerpApi India Hackathon 2026.
