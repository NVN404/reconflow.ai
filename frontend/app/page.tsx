"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Sparkles } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ProblemSection } from "@/components/ProblemSection";
import { SearchBar } from "@/components/SearchBar";
import { SummaryCards } from "@/components/SummaryCards";
import { GraphCanvas } from "@/components/GraphCanvas";
import { FindingDrawer } from "@/components/FindingDrawer";
import { ThoughtStream } from "@/components/ThoughtStream";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { RemediationSection } from "@/components/RemediationSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { PricingSection } from "@/components/PricingSection";
import { FinalCTASection } from "@/components/FinalCTASection";
import { Footer } from "@/components/Footer";

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
    generated_at: "2026-09-26T00:00:00Z",
  },
  executive_summary:
    "ReconFlow AI Standing By. Enter any target domain (e.g. reconflow.ai) to initiate multi-engine external reconnaissance across Google, Bing, DuckDuckGo, YouTube, and Google Play.",
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
      message: "100% Pure SerpApi Autonomous Recon active (Passive Search Intelligence). Ready to audit target perimeter.",
      status: "success",
    },
  ]);

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
        message: "100% Pure SerpApi Autonomous Recon active (Passive Search Intelligence). Ready to audit target perimeter.",
        status: "success",
      },
    ]);
  }, []);

  const handleToggleLayout = () => {
    setLayoutDirection((prev) => (prev === "TB" ? "LR" : "TB"));
  };

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!scanResult || !scanResult.nodes) return { nodes: [], edges: [] };

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

    const el = document.getElementById("graph-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

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

  const handleStartReconClick = () => {
    const el = document.getElementById("graph-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans selection:bg-[#B7E36A]/20 selection:text-[var(--foreground)]">
      {/* Top Navbar */}
      <Navbar onExportDossier={handleExportDossier} onStartReconClick={handleStartReconClick} />

      {/* Hero Section with Particle Wave */}
      <HeroSection onScanTarget={handleScan} isScanning={isScanning} />

      {/* Section 2: The Perimeter Problem */}
      <ProblemSection />

      {/* Section 3 & 5: Attack-Surface Graph & Live Workspace */}
      <section id="graph-section" className="py-20 px-4 max-w-7xl w-full mx-auto space-y-6">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
            <span>Live Workspace // Intelligence Graph</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Interactive Attack-Surface Graph
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Execute target audits, explore connected nodes, inspect vulnerability evidence, and extract defensive playbooks.
          </p>
        </div>

        {/* Search Bar & Controls */}
        <SearchBar onScan={handleScan} isScanning={isScanning} />

        {/* Executive Threat Briefing Callout */}
        {scanResult?.executive_summary && (
          <div className="p-4 rounded-lg bg-[#0B0B0B] border border-zinc-800 flex items-start gap-3.5 shadow-sm font-mono text-xs">
            <div className="p-2 rounded bg-[#111111] text-zinc-400 mt-0.5 border border-zinc-800">
              <Sparkles className="w-4 h-4 text-[#B7E36A]" />
            </div>
            <div className="flex-1 leading-relaxed text-zinc-300 font-sans">
              <span className="font-bold text-zinc-100 block mb-1 font-mono uppercase tracking-wider text-[11px]">
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

        {/* Autonomous Agent Thought Stream */}
        <ThoughtStream thoughts={thoughts} isScanning={isScanning} />
      </section>

      {/* Section 4: How ReconFlow Works */}
      <HowItWorksSection />

      {/* Section 6: Findings & Remediation */}
      <RemediationSection />

      {/* Section 7: Capabilities */}
      <CapabilitiesSection />

      {/* Section 8: Pricing */}
      <PricingSection />

      {/* Section 9: Final CTA */}
      <FinalCTASection onScanTarget={handleScan} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
