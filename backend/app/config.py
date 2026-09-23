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
    key = os.getenv("SERPAPI_KEY", "").strip()
    if not key and (ROOT_DIR / ".env").exists():
        try:
            with open(ROOT_DIR / ".env") as f:
                for line in f:
                    if line.strip().startswith("SERPAPI_KEY="):
                        val = line.strip().split("SERPAPI_KEY=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            key = val
                            os.environ["SERPAPI_KEY"] = key
                            break
        except Exception:
            pass
    return key

def get_gemini_api_key() -> str:

    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key and (ROOT_DIR / ".env").exists():
        try:
            with open(ROOT_DIR / ".env") as f:
                for line in f:
                    if line.strip().startswith("GEMINI_API_KEY="):
                        val = line.strip().split("GEMINI_API_KEY=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            key = val
                            os.environ["GEMINI_API_KEY"] = key
                            break
        except Exception:
            pass
    return key

SERPAPI_KEY = get_serpapi_key()
GEMINI_API_KEY = get_gemini_api_key()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))



CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

