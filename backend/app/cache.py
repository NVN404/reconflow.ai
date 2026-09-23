import json
from pathlib import Path
from typing import Optional, Dict, Any
from app.config import CACHE_DIR

def get_cached_scan(domain: str) -> Optional[Dict[str, Any]]:
    # Cache strictly disabled — every scan executes real-time multi-engine reconnaissance
    return None

def set_cached_scan(domain: str, data: Dict[str, Any]) -> None:
    clean_domain = domain.strip().lower()
    cache_file = CACHE_DIR / f"{clean_domain}.json"
    try:
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error caching scan for {domain}: {e}")
