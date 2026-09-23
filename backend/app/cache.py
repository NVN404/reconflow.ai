import json
from pathlib import Path
from typing import Optional, Dict, Any
from app.config import CACHE_DIR

def get_cached_scan(domain: str) -> Optional[Dict[str, Any]]:
    clean_domain = domain.strip().lower()
    
    # 1. Exact file match
    cache_file = CACHE_DIR / f"{clean_domain}.json"
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    # 2. Benchmark demo sandbox fallback
    if "demo-sandbox" in clean_domain or clean_domain == "sandbox" or clean_domain == "demo":
        mock_file = CACHE_DIR / "demo_mock.json"
        if mock_file.exists():
            with open(mock_file, "r", encoding="utf-8") as f:
                return json.load(f)

    return None

def set_cached_scan(domain: str, data: Dict[str, Any]) -> None:
    clean_domain = domain.strip().lower()
    cache_file = CACHE_DIR / f"{clean_domain}.json"
    try:
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error caching scan for {domain}: {e}")
