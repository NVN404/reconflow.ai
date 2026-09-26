"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  Download,
  Sparkles,
} from "lucide-react";

import { GraphCanvas } from "@/components/GraphCanvas";
import { SearchBar } from "@/components/SearchBar";
import { SummaryCards } from "@/components/SummaryCards";
import { FindingDrawer } from "@/components/FindingDrawer";
import { ThoughtStream } from "@/components/ThoughtStream";
import { getLayoutedElements } from "@/lib/layout";
import { ScanResult, GraphNode, AgentThought } from "@/lib/types";

const initialScanResult: ScanResult = {
  summary: {
    target: "Standing By",
    total_nodes: 0,
    critical_risks: 0,
    high_risks: 0,
    medium_risks: 0,
    low_risks: 0,
    info: 0,
    security_score: 100,
    security_grade: "A",
    serpapi_credits_used: 0,
    generated_at: "2026-09-24T00:00:00Z",
  },
  executive_summary: "ReconFlow AI Armed. Enter any target domain (e.g. reconflow.ai) and click 'Execute Live Recon' to initiate real-time multi-engine reconnaissance across Google, Bing, DuckDuckGo, YouTube, and Google Play.",
  nodes: [],
  edges: [],
  thoughts: [],
};

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResult>(initialScanResult);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [thoughts, setThoughts] = useState<AgentThought[]>([
    {
      timestamp: "READY",
      stage: "ARMED",
      message: "ReconFlow AI Multi-Engine Agent initialized (Google, Bing, DuckDuckGo, YouTube, Google Play).",
      status: "info",
    },
    {
      timestamp: "READY",
      stage: "READY",
      message: "Hybrid Recon mode active (Passive Search Intelligence + Light-Touch Telemetry). Ready to audit target perimeter.",
      status: "success",
    },
  ]);

  // Sync client-side timestamp on mount to prevent SSR hydration mismatch
  useEffect(() => {
    const now = new Date().toLocaleTimeString("en-GB");
    setThoughts([
      {
        timestamp: now,
        stage: "ARMED",
        message: "ReconFlow AI Multi-Engine Agent initialized (Google, Bing, DuckDuckGo, YouTube, Google Play).",
        status: "info",
      },
      {
        timestamp: now,
        stage: "READY",
        message: "Hybrid Recon mode active (Passive Search Intelligence + Light-Touch Telemetry). Ready to audit target perimeter.",
        status: "success",
      },
    ]);
  }, []);

  // Handle Graph Layout Direction Toggle
  const handleToggleLayout = () => {
    setLayoutDirection((prev) => (prev === "TB" ? "LR" : "TB"));
  };

  // Layout nodes with Dagre auto-layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!scanResult || !scanResult.nodes) return { nodes: [], edges: [] };

    // Apply severity or section filter if not 'ALL'
    let filteredNodes = scanResult.nodes;
    if (activeFilter !== "ALL") {
      filteredNodes = scanResult.nodes.filter(
        (n) =>
          n.type === "rootNode" ||
          (n.data as any).severity === activeFilter ||
          (n.data as any).section === activeFilter ||
          (activeFilter === "THREAT_RADAR" && (
            (n.data as any).origin === "EXTERNAL" ||
            n.type === "externalExposureNode" ||
            (n.data as any).category === "CUSTOM_DORK" ||
            (n.data as any).category === "S3_LEAK" ||
            (n.data as any).category === "GITHUB_LEAK" ||
            (n.data as any).category === "GITHUB_REPO" ||
            (n.data as any).category === "YOUTUBE_POC" ||
            (n.data as any).category === "MOBILE_APP" ||
            (n.data as any).category === "NEWS_BREACH" ||
            (n.data as any).category === "BRAND_PRESENCE"
          ))
      );
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = scanResult.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    return getLayoutedElements(
      filteredNodes as unknown as GraphNode[],
      filteredEdges,
      layoutDirection
    );
  }, [scanResult, activeFilter, layoutDirection]);

  // Handle Live Scan Request
  const handleScan = async (
    domain: string,
    enablePhase2: boolean = true,
    customDorks: string[] = [],
    enabledVectors?: Record<string, boolean>
  ) => {
    setIsScanning(true);
    setSelectedNode(null);

    // Initial streaming log
    const startTime = new Date().toLocaleTimeString("en-GB");
    setThoughts([
      {
        timestamp: startTime,
        stage: "DISPATCH",
        message: `Deploying live SerpApi multi-engine recon agent for target: ${domain}...`,
        status: "info",
      },
    ]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res = await fetch(`${apiUrl}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          enable_phase2: enablePhase2,
          use_cache: false,
          custom_dorks: customDorks,
          enabled_vectors: enabledVectors,
        }),
      });

      if (res.ok) {
        const data: ScanResult = await res.json();
        setScanResult(data);
        if (data.thoughts && data.thoughts.length > 0) {
          setThoughts(data.thoughts);
        }
      } else {
        throw new Error(`Backend returned status ${res.status}`);
      }
    } catch (err: any) {
      console.error("Live scan failed:", err);
      setThoughts((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString("en-GB"),
          stage: "ERROR",
          message: `Scan error: ${err?.message || "Failed to reach backend"}. Please verify backend on port 8001.`,
          status: "critical",
        },
      ]);
    }

    setIsScanning(false);
  };

  // Export Executive Markdown Dossier
  const handleExportDossier = () => {
    if (!scanResult) return;
    const { summary, executive_summary, nodes } = scanResult;

    let md = `# EXECUTIVE ATTACK SURFACE AUDIT DOSSIER: ${summary.target.toUpperCase()}\n\n`;
    md += `**Generated By:** ReconFlow AI (Autonomous EASM Agent)\n`;
    md += `**Date:** ${new Date().toUTCString()}\n`;
    md += `**Security Posture Grade:** ${summary.security_grade} (${summary.security_score}/100)\n`;
    md += `**SerpApi Credits Consumed:** ${summary.serpapi_credits_used}\n\n`;

    md += `## 1. Executive Summary\n${executive_summary}\n\n`;

    md += `## 2. Risk Distribution\n`;
    md += `| Severity | Finding Count |\n| :--- | :--- |\n`;
    md += `| **CRITICAL** | ${summary.critical_risks} |\n`;
    md += `| **HIGH** | ${summary.high_risks} |\n`;
    md += `| **MEDIUM** | ${summary.medium_risks} |\n`;
    md += `| **LOW / ASSETS** | ${summary.low_risks} |\n`;
    md += `| **TOTAL NODES** | ${summary.total_nodes} |\n\n`;

    md += `## 3. Discovered Vulnerabilities & Remediation Directives\n\n`;
    nodes
      .filter((n) => n.type === "findingNode" || n.type === "externalNode")
      .forEach((n, idx) => {
        md += `### ${idx + 1}. [${n.data.severity}] ${n.data.label}\n\n`;
        md += `- **Section:** ${n.data.section === "VULNERABILITY" ? "🚨 Active Vulnerability Perimeter" : "🛡️ Perimeter Assets & Intelligence"}\n`;
        md += `- **Surface Category:** ${n.data.surface} (${n.data.category})\n`;
        md += `- **Target Endpoint:** ${n.data.metadata.url}\n`;
        md += `- **Search Engine Dork Operator:** \`${n.data.metadata.dork_used}\`\n`;
        if (n.data.cvss_score) md += `- **CVSS Severity Rating:** ${n.data.cvss_score}\n`;
        if (n.data.owasp_tag) md += `- **OWASP Standard:** ${n.data.owasp_tag}\n`;
        if (n.data.cwe_id) md += `- **CWE Classification:** ${n.data.cwe_id}\n`;
        md += `\n`;

        if (n.data.what_is_the_bug) {
          md += `#### Executive Issue Summary\n${n.data.what_is_the_bug}\n\n`;
        }

        if (n.data.why_it_is_a_bug) {
          md += `#### Threat Analysis: Why This Is a Security Risk\n${n.data.why_it_is_a_bug}\n\n`;
        }

        if (n.data.attack_vector) {
          md += `#### Adversary Attack Vector\n\`\`\`text\n${n.data.attack_vector}\n\`\`\`\n\n`;
        }

        md += `#### Extracted Evidence & Context\n> ${n.data.metadata.snippet || "Discovered via automated reconnaissance sweep."}\n\n`;

        md += `#### Defensive Remediation: How to Fix\n`;
        md += `${n.data.how_to_fix || n.data.remediation || "Isolate endpoint and enforce access boundaries."}\n\n`;

        if (n.data.remediation_steps && n.data.remediation_steps.length > 0) {
          md += `**Remediation Action Items:**\n\`\`\`bash\n${n.data.remediation_steps.join("\n\n")}\n\`\`\`\n\n`;
        }

        md += `---\n\n`;
      });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ReconFlow_Dossier_${summary.target}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans">
      {/* Top Header / Navigation Bar */}
      <header className="border-b border-white/[0.06] bg-[#0d1117]/90 backdrop-blur-xl sticky top-0 z-40 font-sans">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-bold">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold tracking-tight text-slate-100">
                  RECONFLOW<span className="text-sky-400">.AI</span>
                </h1>
                <span className="text-xs font-sans font-medium px-2.5 py-0.5 rounded-md bg-[#10253d] text-[#6fb2f5]">
                  Track 01: AI Agents
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Autonomous External Attack Surface Management & Threat Intelligence
              </p>
            </div>
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 bg-[#141a24] border border-white/[0.06] px-3 py-1.5 rounded-lg font-sans">
              <span className="w-2 h-2 rounded-full bg-[#4ade9b]" />
              SerpApi Hackathon 2026
            </span>

            <button
              onClick={handleExportDossier}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-[#141a24] hover:bg-[#1a2230] text-slate-200 border border-white/[0.08] hover:border-white/[0.18] transition-all duration-150 active:scale-95 shadow-sm cursor-pointer font-sans"
              title="Download executive audit report in Markdown"
            >
              <Download className="w-3.5 h-3.5 text-[#6fb2f5]" />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Search Bar & Controls */}
        <SearchBar onScan={handleScan} isScanning={isScanning} />

        {/* Executive Threat Briefing Callout */}
        {scanResult?.executive_summary && (
          <div className="p-4 rounded-xl bg-[#141a24] border border-white/[0.08] flex items-start gap-3.5 shadow-sm font-sans">
            <div className="p-2 rounded-lg bg-[#10253d] text-[#6fb2f5] mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs leading-relaxed text-slate-300">
              <span className="font-semibold text-slate-100 block mb-1">
                Executive Threat Briefing
              </span>
              {scanResult.executive_summary}
            </div>
          </div>
        )}

        {/* Metric Summary Cards */}
        {scanResult?.summary && (
          <SummaryCards
            summary={scanResult.summary}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        )}

        {/* React Flow Interactive Graph Canvas */}
        <div className="relative">
          <GraphCanvas
            nodes={layoutedNodes}
            edges={layoutedEdges}
            onNodeClick={setSelectedNode}
            selectedNodeId={selectedNode?.id}
            layoutDirection={layoutDirection}
            onToggleLayout={handleToggleLayout}
          />

          {/* Finding Detail Slide-Out Drawer */}
          <FindingDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>

        {/* Autonomous Agent Thought Stream (Terminal Feed) */}
        <ThoughtStream thoughts={thoughts} isScanning={isScanning} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#0d1117] py-4 mt-8 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Built with <strong className="text-slate-400 font-medium">serpapi-search-tools</strong> &amp;{" "}
            <strong className="text-slate-400 font-medium">SerpApi MCP</strong> for SerpApi India Hackathon 2026.
          </div>
          <div>
            Target: <span className="text-[#6fb2f5] font-mono">{scanResult?.summary?.target || "Standing By"}</span> |{" "}
            <span className="text-emerald-400">Non-Intrusive Hybrid EASM (Search Intel + RFC Telemetry)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
