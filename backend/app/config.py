import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from root or backend directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent

def load_env_vars():
    # Load backend .env then root .env, ensuring non-empty values win
    if (BACKEND_DIR / ".env").exists():
        load_dotenv(BACKEND_DIR / ".env", override=False)
    if (ROOT_DIR / ".env").exists():
        load_dotenv(ROOT_DIR / ".env", override=True)

load_env_vars()

def get_serpapi_key() -> str:
    # First check .env files dynamically for freshest key
    for env_path in [ROOT_DIR / ".env", BACKEND_DIR / ".env"]:
        if env_path.exists():
            try:
                with open(env_path) as f:
                    for line in f:
                        line_s = line.strip()
                        if line_s.startswith("SERPAPI_KEY="):
                            val = line_s.split("SERPAPI_KEY=", 1)[1].strip().strip('"').strip("'")
                            if val:
                                os.environ["SERPAPI_KEY"] = val
                                return val
            except Exception:
                pass
    return os.getenv("SERPAPI_KEY", "").strip()

def get_gemini_api_key() -> str:
    for env_path in [ROOT_DIR / ".env", BACKEND_DIR / ".env"]:
        if env_path.exists():
            try:
                with open(env_path) as f:
                    for line in f:
                        line_s = line.strip()
                        if line_s.startswith("GEMINI_API_KEY="):
                            val = line_s.split("GEMINI_API_KEY=", 1)[1].strip().strip('"').strip("'")
                            if val:
                                os.environ["GEMINI_API_KEY"] = val
                                return val
            except Exception:
                pass
    return os.getenv("GEMINI_API_KEY", "").strip()

SERPAPI_KEY = get_serpapi_key()
GEMINI_API_KEY = get_gemini_api_key()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))



CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

