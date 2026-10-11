import os
import json
import time
import requests
from typing import Dict, Any, List, Optional, Tuple
from app.config import SERPAPI_KEY, get_serpapi_key


class SerpApiMCPClient:
    """
    Client for interacting with the official SerpApi Model Context Protocol (MCP) Server.
    Protocol: MCP 2026 specification over Streamable HTTP / JSON-RPC 2.0.
    Hosted Server: https://mcp.serpapi.com/{API_KEY}/mcp
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or get_serpapi_key() or SERPAPI_KEY
        self.endpoint = f"https://mcp.serpapi.com/{self.api_key}/mcp" if self.api_key else ""
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        }

    def is_available(self) -> bool:
        """Checks if the SerpApi MCP endpoint is reachable and responsive."""
        if not self.endpoint:
            return False
        try:
            payload = {
                "jsonrpc": "2.0",
                "id": "ping",
                "method": "tools/list",
                "params": {}
            }
            resp = requests.post(self.endpoint, json=payload, headers=self.headers, timeout=5)
            return resp.status_code == 200
        except Exception:
            return False

    def search(
        self,
        query: str,
        engine: str = "google_light",
        output_format: str = "json",
        mode: str = "compact",
        timeout: int = 7
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Executes a search via the official SerpApi MCP 'search' tool.
        Returns: (results_list, error_message)
        """
        if not self.endpoint:
            return [], "No SerpApi API key configured."

        # Map engines to MCP compatible identifiers
        mcp_engine = engine
        if engine == "google":
            mcp_engine = "google_light"
        elif engine == "youtube":
            mcp_engine = "youtube_search"
        elif engine == "google_play":
            # google_play is not supported by MCP server, gracefully fallback to REST
            return [], "Engine google_play not supported on MCP server (use REST)"

        params: Dict[str, Any] = {
            "q": query,
            "engine": mcp_engine,
        }
        if output_format == "md":
            params["output"] = "md"

        payload = {
            "jsonrpc": "2.0",
            "id": f"mcp-search-{int(time.time() * 1000)}",
            "method": "tools/call",
            "params": {
                "name": "search",
                "arguments": {
                    "params": params,
                    "mode": mode
                }
            }
        }

        try:
            resp = requests.post(self.endpoint, json=payload, headers=self.headers, timeout=timeout)
            if resp.status_code != 200:
                return [], f"MCP Server returned HTTP {resp.status_code}: {resp.text[:120]}"

            data = resp.json()
            if "error" in data:
                err_msg = data["error"].get("message", "Unknown MCP RPC error")
                return [], f"MCP Error: {err_msg}"

            result = data.get("result", {})
            content = result.get("content", [])
            if not content:
                return [], None

            # Parse content text
            text_content = content[0].get("text", "")
            if not text_content:
                return [], None

            try:
                parsed_json = json.loads(text_content)
                organic = (
                    parsed_json.get("organic_results")
                    or parsed_json.get("news_results")
                    or parsed_json.get("video_results")
                    or []
                )
                return organic, None
            except json.JSONDecodeError:
                # If output was markdown or raw text
                return [{"raw_content": text_content}], None

        except requests.exceptions.Timeout:
            return [], "MCP search request timed out."
        except Exception as e:
            return [], f"MCP execution error: {str(e)}"
