from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class FindingMetadata(BaseModel):
    url: str
    snippet: str
    dork_used: str
    discovered_at: str

class NodeData(BaseModel):
    label: str
    category: str        # ROOT_DOMAIN | INFRASTRUCTURE | API_DOCS | CONFIG_LEAK | GITHUB_LEAK | S3_LEAK | NEWS_BREACH | TOKEN_LEAK | DOCUMENT_LEAK | YOUTUBE_POC | MOBILE_APP
    severity: str        # INFO | LOW | MEDIUM | HIGH | CRITICAL
    origin: str          # INTERNAL | EXTERNAL
    surface: str         # Apex DNS | Subdomain | Web Server Root | GitHub Repository | AWS S3 Bucket | Google News | Exploit Radar | Mobile Store | Perimeter Shield
    engine: str = "google" # google | google_light | bing | duckduckgo | google_news | youtube | google_play
    section: str = "INFO" # "INFO" (Perimeter Assets & Intel) | "VULNERABILITY" (Active Vulnerabilities & Leaks)
    triage_reason: Optional[str] = None
    triage_classification: Optional[str] = None
    owasp_tag: Optional[str] = None
    cwe_id: Optional[str] = None
    cvss_score: Optional[str] = None
    what_is_the_bug: Optional[str] = None
    why_it_is_a_bug: Optional[str] = None
    attack_vector: Optional[str] = None
    how_to_fix: Optional[str] = None
    remediation_steps: Optional[List[str]] = None
    evidence_details: Optional[Dict[str, str]] = None
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
    info_assets_count: int = 0
    vulnerability_count: int = 0
    ai_discarded_noise_count: int = 0
    external_threat_count: int = 0
    security_score: int  # 0 to 100
    security_grade: str  # A, B, C, D, F
    serpapi_credits_used: int
    generated_at: str
    protocol_used: str = "rest"  # "rest" | "mcp" | "both"

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
    custom_dorks: Optional[List[str]] = Field(default_factory=list)
    enabled_vectors: Optional[Dict[str, bool]] = Field(default_factory=dict)
    protocol: Optional[str] = "rest"  # "rest" | "mcp" | "both"
