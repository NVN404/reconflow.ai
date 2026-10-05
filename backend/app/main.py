from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import stripe
from pydantic import BaseModel
from typing import Optional

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

class CheckoutSessionRequest(BaseModel):
    plan: Optional[str] = "Professional Plan"
    amount: Optional[int] = 4900 # in cents ($49)
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None

@app.post("/api/create-checkout-session")
def create_checkout_session(req: CheckoutSessionRequest):
    stripe_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
    if not stripe_key:
        raise HTTPException(status_code=500, detail="STRIPE_SECRET_KEY is not configured on server.")

    stripe.api_key = stripe_key

    # Standard default URLs
    success_url = req.success_url or "http://localhost:3000/recon?session_id={CHECKOUT_SESSION_ID}&upgraded=true"
    cancel_url = req.cancel_url or "http://localhost:3000/recon?canceled=true"

    try:
        session = stripe.checkout.Session.create(
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"ReconFlow AI — {req.plan}",
                        "description": "Continuous Attack Surface Monitoring, 6-Engine SerpApi Recon & Unlimited Sweeps",
                    },
                    "unit_amount": req.amount or 4900,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")


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

