export type SeverityLevel = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FindingCategory =
  | "ROOT_DOMAIN"
  | "INFRASTRUCTURE"
  | "API_DOCS"
  | "CONFIG_LEAK"
  | "GITHUB_LEAK"
  | "S3_LEAK"
  | "NEWS_BREACH";

export type FindingOrigin = "INTERNAL" | "EXTERNAL";

export interface FindingMetadata {
  url: string;
  snippet: string;
  dork_used: string;
  discovered_at: string;
}

export interface NodeData extends Record<string, unknown> {
  label: string;
  category: FindingCategory;
  severity: SeverityLevel;
  origin: FindingOrigin;
  surface: string;
  engine?: string;
  owasp_tag?: string;
  cwe_id?: string;
  remediation?: string;
  metadata: FindingMetadata;
}

import type { Node as XYNode, Edge as XYEdge } from "@xyflow/react";

export type GraphNode = XYNode<NodeData>;
export type GraphEdge = XYEdge;

export interface ScanSummary {
  target: string;
  total_nodes: number;
  critical_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  info: number;
  security_score: number;
  security_grade: string;
  serpapi_credits_used: number;
  generated_at: string;
}

export interface AgentThought {
  timestamp: string;
  stage: string;
  message: string;
  status: "info" | "warning" | "critical" | "success";
}

export interface ScanResult {
  summary: ScanSummary;
  executive_summary: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  thoughts?: AgentThought[];
}

export interface ScanRequest {
  domain: string;
  enable_phase2?: boolean;
  use_cache?: boolean;
}
