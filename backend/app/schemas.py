from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class FindingMetadata(BaseModel):
    url: str
    snippet: str
    dork_used: str
    discovered_at: str

class NodeData(BaseModel):
    label: str
    category: str        # ROOT_DOMAIN | INFRASTRUCTURE | API_DOCS | CONFIG_LEAK | GITHUB_LEAK | S3_LEAK | NEWS_BREACH
    severity: str        # INFO | LOW | MEDIUM | HIGH | CRITICAL
    origin: str          # INTERNAL | EXTERNAL
    surface: str         # Apex DNS | Subdomain | Web Server Root | GitHub Repository | AWS S3 Bucket | Google News
    engine: str = "google" # google | google_light | bing | google_news
    owasp_tag: Optional[str] = None
    cwe_id: Optional[str] = None
    remediation: Optional[str] = None
    metadata: FindingMetadata

class GraphNode(BaseModel):
    id: str
    type: str            # rootNode | assetNode | findingNode | externalNode
    data: NodeData
    position: Dict[str, float]

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    animated: bool = False
    style: Dict[str, Any] = Field(default_factory=dict)

class ScanSummary(BaseModel):
    target: str
    total_nodes: int
    critical_risks: int
    high_risks: int
    medium_risks: int
    low_risks: int
    info: int
    security_score: int  # 0 to 100
    security_grade: str  # A, B, C, D, F
    serpapi_credits_used: int
    generated_at: str

class AgentThought(BaseModel):
    timestamp: str
    stage: str
    message: str
    status: str          # "info" | "warning" | "critical" | "success"

class ScanResult(BaseModel):
    summary: ScanSummary
    executive_summary: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    thoughts: List[AgentThought] = Field(default_factory=list)

class ScanRequest(BaseModel):
    domain: str
    enable_phase2: bool = False
    use_cache: bool = True
