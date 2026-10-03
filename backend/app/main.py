from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import ScanRequest, ScanResult
from app.services.phase1_domain import Phase1DomainScanner
from app.cache import get_cached_scan
from app.remediation import REMEDIATION_PLAYBOOKS

app = FastAPI(
    title="ReconFlow AI — EASM Agent API",
    description="Autonomous External Attack Surface Management & Threat Intelligence Engine for SerpApi India Hackathon 2026",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scanner = Phase1DomainScanner()

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "ReconFlow AI EASM Agent",
        "version": "1.0.0",
        "track": "Track 01: AI Agents",
        "mcp_enabled": True
    }

@app.post("/api/scan", response_model=ScanResult)
def run_recon_scan(req: ScanRequest):
    if not req.domain or not req.domain.strip():
        raise HTTPException(status_code=400, detail="Target domain must not be empty.")
    
    result = scanner.scan(
        target=req.domain,
        use_cache=req.use_cache,
        enable_phase2=req.enable_phase2,
        custom_dorks=req.custom_dorks,
        enabled_vectors=req.enabled_vectors
    )
    return result


@app.get("/api/cache/{domain}")
def get_cached_report(domain: str):
    cached = get_cached_scan(domain)
    if not cached:
        raise HTTPException(status_code=404, detail="No cached dossier found for this target domain.")
    return cached

@app.get("/api/remediation")
def get_all_remediations():
    return REMEDIATION_PLAYBOOKS

@app.get("/api/remediation/{category}")
def get_category_remediation(category: str):
    cat_upper = category.upper()
    if cat_upper in REMEDIATION_PLAYBOOKS:
        return REMEDIATION_PLAYBOOKS[cat_upper]
    raise HTTPException(status_code=404, detail="Category not found.")

@app.get("/api/toolchain")
@app.get("/api/engines")
def toolchain_status():
    """Report active SerpApi reconnaissance engines (100% Pure SerpApi Intelligence)."""
    engines = {
        "Google": True,
        "Bing": True,
        "DuckDuckGo": True,
        "YouTube": True,
        "Google News": True,
        "Google Play": True,
    }
    return {
        "engines": engines,
        "tools": engines,
        "mode": "100% Pure SerpApi Intelligence",
        "active_count": len(engines),
        "pipeline_ready": True,
        "pipeline_tools": list(engines.keys()),
    }

