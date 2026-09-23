import requests
from typing import Dict, Any, List
from app.config import SERPAPI_KEY

class SerpApiMCPClient:
    """
    Client for interacting with the official SerpApi Model Context Protocol (MCP) Server.
    Complies with MCP 2026 specifications.
    Hosted Server: https://mcp.serpapi.com/{API_KEY}/mcp
    """
    def __init__(self, api_key: str = ""):
        self.api_key = api_key or SERPAPI_KEY
        self.mcp_base_url = f"https://mcp.serpapi.com/{self.api_key}/mcp" if self.api_key else ""

    def search_via_mcp(self, query: str, engine: str = "google_light", mode: str = "compact") -> List[Dict[str, Any]]:
        """
        Executes a search via the SerpApi MCP standard 'search' tool.
        """
        if not self.mcp_base_url:
            return []

        payload = {
            "name": "search",
            "arguments": {
                "params": {
                    "q": query,
                    "engine": engine,
                    "output": "md"
                },
                "mode": mode
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        try:
            resp = requests.post(self.mcp_base_url, json=payload, headers=headers, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("content", [])
        except Exception as e:
            print(f"MCP Search call error for {query}: {e}")

        return []
