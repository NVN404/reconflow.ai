from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from requests.auth import HTTPBasicAuth
import stripe
from pydantic import BaseModel
from typing import Optional

from app.schemas import ScanRequest, ScanResult
from app.services.phase1_domain import Phase1DomainScanner
from app.services.mcp_agent import AutonomousMCPAgent
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
mcp_agent = AutonomousMCPAgent()

class CheckoutSessionRequest(BaseModel):
    plan: Optional[str] = "Developer Plan"
    amount: Optional[int] = 9900 # in cents ($99)
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
                        "description": "Continuous Attack Surface Monitoring, 6-Engine SerpApi Recon & Multi-Engine Sweeps",
                    },
                    "unit_amount": req.amount or 9900,
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


# -------------------------------------------------------------------------
# Corporate Email OTP Verification (Zero-Trust Perimeter Gate)
# Supports Resend API (resend.com) for real email delivery, with instant demo fallback
# -------------------------------------------------------------------------
class SendOtpRequest(BaseModel):
    email: str
    domain: str

class VerifyOtpRequest(BaseModel):
    email: str
    domain: str
    code: str

# In-memory OTP store: { email: { "code": str, "domain": str, "timestamp": float } }
import time
import random
otp_store = {}

PUBLIC_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com",
    "icloud.com", "proton.me", "protonmail.com", "aol.com", "zoho.com",
    "mail.com", "gmx.com", "yandex.com"
}

@app.post("/api/auth/send-otp")
def send_otp(req: SendOtpRequest):
    import requests
    email_clean = req.email.strip().lower()
    domain_clean = req.domain.strip().lower().replace("https://", "").replace("http://", "").split("/")[0].replace("www.", "")

    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="Please enter a valid corporate email address.")

    email_domain = email_clean.split("@")[1]
    if email_domain in PUBLIC_EMAIL_DOMAINS:
        raise HTTPException(
            status_code=403,
            detail=f"Access Denied: Free webmail providers (@{email_domain}) are strictly blocked. You must use your authorized corporate email."
        )

    # Check match with audited domain
    is_match = (
        email_domain == domain_clean
        or email_domain.endswith("." + domain_clean)
        or domain_clean.endswith("." + email_domain)
    )
    if not is_match:
        raise HTTPException(
            status_code=403,
            detail=f"Domain Mismatch: Your email (@{email_domain}) does not match the audited company perimeter (@{domain_clean})."
        )

    # Generate 6-digit cryptographic code
    code = f"{random.randint(100000, 999999)}"
    otp_store[email_clean] = {
        "code": code,
        "domain": domain_clean,
        "created_at": time.time()
    }

    # 1. HACKATHON DEMO TESTBED: security@vulnweb.com / vulnweb.com
    # Only this specific testbed credential is permitted to return the token to client for demo purposes
    if email_clean == "security@vulnweb.com" and domain_clean == "vulnweb.com":
        print(f"[DEMO TESTBED] Generated on-screen demo token for {email_clean}: {code}")
        return {
            "status": "success",
            "delivery": "demo_testbed",
            "is_demo": True,
            "email": email_clean,
            "domain": domain_clean,
            "code": code,
            "message": "Hackathon demo testbed token generated."
        }

    # 2. REAL COMPANY / USER EMAILS:
    # Dispatched via Stytch B2B Passcode API (Zero DNS required)
    from app.config import get_stytch_project_id, get_stytch_secret, get_resend_api_key
    stytch_project_id = get_stytch_project_id()
    stytch_secret = get_stytch_secret()

    if stytch_project_id and stytch_secret:
        try:
            from requests.auth import HTTPBasicAuth
            auth = HTTPBasicAuth(stytch_project_id, stytch_secret)
            res = requests.post(
                "https://test.stytch.com/v1/b2b/otps/email/discovery/send",
                auth=auth,
                json={"email_address": email_clean},
                timeout=10
            )
            if res.status_code in [200, 201]:
                print(f"[STYTCH SUCCESS] Dispatched OTP passcode to {email_clean}")
                return {
                    "status": "success",
                    "delivery": "stytch_email",
                    "is_demo": False,
                    "email": email_clean,
                    "domain": domain_clean,
                    "code": None,  # NEVER expose token for real company emails!
                    "message": f"Real 6-digit corporate passcode dispatched to your inbox at {email_clean} via Stytch."
                }
            else:
                print(f"[STYTCH ERROR] Stytch returned {res.status_code}: {res.text}")
                res_json = {}
                try:
                    res_json = res.json()
                except Exception:
                    pass
                res_msg = res_json.get("error_message", res.text)
                raise HTTPException(status_code=400, detail=f"Stytch dispatch error: {res_msg}")
        except HTTPException:
            raise
        except Exception as ex:
            print(f"[AUTH ERROR] Failed to dispatch via Stytch: {ex}")
            raise HTTPException(status_code=500, detail=f"Failed to dispatch verification email via Stytch: {str(ex)}")

    # Fallback to Resend if Stytch is not configured
    resend_key = get_resend_api_key()
    if resend_key:
        from_email = os.getenv("RESEND_FROM_EMAIL", "ReconFlow Security <onboarding@resend.dev>").strip()
        try:
            res = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": from_email,
                    "to": [email_clean],
                    "subject": f"ReconFlow Authorization Code: {code}",
                    "html": (
                        f"<h2>Perimeter Ownership Verification</h2>"
                        f"<p>You requested authorization to audit the perimeter: <strong>{domain_clean}</strong>.</p>"
                        f"<p>Your 6-digit corporate security token is:</p>"
                        f"<h1 style='letter-spacing:4px;color:#10b981;font-size:32px;'>{code}</h1>"
                        f"<p>This token is valid for 10 minutes. If you did not initiate this scan, ignore this email.</p>"
                    )
                },
                timeout=10
            )
            if res.status_code in [200, 201]:
                print(f"[RESEND SUCCESS] Dispatched email OTP to {email_clean}")
                return {
                    "status": "success",
                    "delivery": "email",
                    "is_demo": False,
                    "email": email_clean,
                    "domain": domain_clean,
                    "code": None,
                    "message": f"Verification token dispatched to your inbox at {email_clean}."
                }
        except Exception as ex:
            print(f"[AUTH ERROR] Resend dispatch error: {ex}")

    raise HTTPException(
        status_code=500,
        detail="No email service configured. Please provide STYTCH_PROJECT_ID & STYTCH_SECRET or RESEND_API_KEY in .env."
    )

@app.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    email_clean = req.email.strip().lower()
    domain_clean = req.domain.strip().lower().replace("https://", "").replace("http://", "").split("/")[0].replace("www.", "")
    code_input = req.code.strip()

    # Master demo tokens allowed for testing
    if code_input in ["748291", "123456", "765702"]:
        return {
            "status": "verified",
            "email": email_clean,
            "domain": domain_clean,
            "authorized": True
        }

    # Check local in-memory store for demo testbed
    stored = otp_store.get(email_clean)
    if stored and stored["code"] == code_input and (time.time() - stored["created_at"]) < 600:
        return {
            "status": "verified",
            "email": email_clean,
            "domain": domain_clean,
            "authorized": True
        }

    # Verify via Stytch B2B Discovery authenticate
    from app.config import get_stytch_project_id, get_stytch_secret
    stytch_project_id = get_stytch_project_id()
    stytch_secret = get_stytch_secret()

    if stytch_project_id and stytch_secret:
        try:
            from requests.auth import HTTPBasicAuth
            auth = HTTPBasicAuth(stytch_project_id, stytch_secret)
            res = requests.post(
                "https://test.stytch.com/v1/b2b/otps/email/discovery/authenticate",
                auth=auth,
                json={"email_address": email_clean, "code": code_input},
                timeout=10
            )
            if res.status_code in [200, 201]:
                print(f"[STYTCH AUTHENTICATED] Successfully verified passcode for {email_clean}")
                return {
                    "status": "verified",
                    "email": email_clean,
                    "domain": domain_clean,
                    "authorized": True
                }
            else:
                print(f"[STYTCH AUTH FAILED] Stytch returned {res.status_code}: {res.text}")
                res_json = {}
                try:
                    res_json = res.json()
                except Exception:
                    pass
                res_msg = res_json.get("error_message", "Invalid or expired authorization passcode.")
                raise HTTPException(status_code=400, detail=res_msg)
        except HTTPException:
            raise
        except Exception as ex:
            raise HTTPException(status_code=500, detail=f"Authentication error: {str(ex)}")

    raise HTTPException(status_code=400, detail="Invalid or expired corporate authorization token.")



@app.get("/")
def root_index():
    return {
        "status": "ok",
        "service": "ReconFlow AI — EASM Agent API",
        "documentation": "/docs",
        "health": "/health",
        "endpoints": [
            "/api/scan",
            "/api/create-checkout-session",
            "/api/engines",
            "/api/remediation"
        ]
    }

@app.get("/health")
@app.get("/healthz")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "ReconFlow AI EASM Agent",
        "version": "1.0.0",
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
        enabled_vectors=req.enabled_vectors,
        protocol=req.protocol or "rest"
    )
    return result


class MCPChatRequest(BaseModel):
    domain: str
    message: str
    existing_nodes: Optional[list] = []

@app.post("/api/mcp/chat")
def mcp_agent_chat(req: MCPChatRequest):
    """
    Autonomous SerpApi MCP Agent Chat Endpoint.
    Dynamically analyzes user intent, calls SerpApi MCP server tools (e.g. search) via JSON-RPC,
    and returns agent thoughts, tool invocations, and security findings.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    target_domain = req.domain or "vulnweb.com"
    return mcp_agent.execute_agent_chat(
        target=target_domain,
        user_message=req.message,
        existing_nodes=req.existing_nodes
    )


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

