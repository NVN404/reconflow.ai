"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Lock,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Download,
  Zap,
  CheckCircle2,
  X,
  AlertCircle,
} from "lucide-react";

import { SearchBar } from "@/components/SearchBar";
import { SummaryCards } from "@/components/SummaryCards";
import { GraphCanvas } from "@/components/GraphCanvas";
import { FindingDrawer } from "@/components/FindingDrawer";
import { ThoughtStream } from "@/components/ThoughtStream";
import { CorporateAuthModal } from "@/components/CorporateAuthModal";
import { PaymentModal } from "@/components/PaymentModal";

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
    generated_at: "2026-10-05T00:00:00Z",
  },
  executive_summary:
    "ReconFlow AI Standing By. Enter any target perimeter (e.g. reconflow.render.com) to initiate autonomous multi-engine external reconnaissance across Google, Bing, DuckDuckGo, YouTube, and Google Play.",
  nodes: [],
  edges: [],
  thoughts: [],
};

interface CorporateSession {
  email: string;
  domain: string;
  companyName: string;
}

function ReconWorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTarget = searchParams.get("target") || "reconflow.render.com";

  const [scanResult, setScanResult] = useState<ScanResult>(initialScanResult);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB");
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Corporate Work Email Authentication State
  const [corporateSession, setCorporateSession] = useState<CorporateSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTargetDomain, setAuthTargetDomain] = useState<string>(initialTarget);
  const [pendingScan, setPendingScan] = useState<{
    domain: string;
    enablePhase2: boolean;
    customDorks: string[];
    enabledVectors?: Record<string, boolean>;
  } | null>(null);

  // Pricing / Scan Limits (1 Free Scan per Day for Hackathon demo)
  const [scanCount, setScanCount] = useState<number>(0);
  const [isProMember, setIsProMember] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [stripeBanner, setStripeBanner] = useState<{
    type: "success" | "canceled";
    message: string;
    sessionId?: string;
  } | null>(null);

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

  // Load persistent Pro & scan state from localStorage, and handle Stripe redirects
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPro = localStorage.getItem("reconflow_pro") === "true";
      const storedCount = parseInt(localStorage.getItem("reconflow_scan_count") || "0", 10);
      setIsProMember(storedPro);
      setScanCount(storedCount);

      // Handle Stripe Checkout Redirect Query Params
      const upgraded = searchParams.get("upgraded");
      const sessionId = searchParams.get("session_id");
      const canceled = searchParams.get("canceled");
      const upgradeReq = searchParams.get("upgrade");

      if (upgraded === "true") {
        setIsProMember(true);
        localStorage.setItem("reconflow_pro", "true");
        setStripeBanner({
          type: "success",
          message: "Official Stripe Test Checkout successful! Unlimited Multi-Engine Sweeps unlocked.",
          sessionId: sessionId || undefined,
        });
      } else if (canceled === "true") {
        setStripeBanner({
          type: "canceled",
          message: "Stripe checkout was canceled. You remain on the Community tier (1 free scan / day).",
        });
      } else if (upgradeReq === "true") {
        setIsPaymentModalOpen(true);
      }
    }
  }, [searchParams]);

  // Compute Dagre Layout for React Flow
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!scanResult || scanResult.nodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    let filteredNodes = scanResult.nodes;
    if (activeFilter === "CRITICAL") {
      filteredNodes = scanResult.nodes.filter((n) => n.data.severity === "CRITICAL");
    } else if (activeFilter === "HIGH") {
      filteredNodes = scanResult.nodes.filter((n) => n.data.severity === "HIGH");
    } else if (activeFilter === "MEDIUM") {
      filteredNodes = scanResult.nodes.filter((n) => n.data.severity === "MEDIUM");
    } else if (activeFilter === "ASSETS") {
      filteredNodes = scanResult.nodes.filter(
        (n) => n.type === "rootNode" || n.type === "subdomainNode"
      );
    } else if (activeFilter === "RADAR") {
      filteredNodes = scanResult.nodes.filter(
        (n) =>
          n.data.surface === "Threat Radar" ||
          n.type === "externalNode"
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

  // Actual API dispatch to backend
  const executeScanRequest = async (
    domain: string,
    enablePhase2: boolean = true,
    customDorks: string[] = [],
    enabledVectors?: Record<string, boolean>
  ) => {
    setIsScanning(true);
    setSelectedNode(null);

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
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const cleanApiUrl = rawApiUrl.replace(/\/+$/, "");
      const scanEndpoint = cleanApiUrl ? `${cleanApiUrl}/api/scan` : "/api/scan";

      const res = await fetch(scanEndpoint, {
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

        // Track scan usage
        const newCount = scanCount + 1;
        setScanCount(newCount);
        if (typeof window !== "undefined") {
          localStorage.setItem("reconflow_scan_count", newCount.toString());
        }
      } else {
        throw new Error(`Endpoint ${scanEndpoint} returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error("Live scan failed:", err);
      setThoughts((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString("en-GB"),
          stage: "ERROR",
          message: `Scan error: ${err?.message || "Failed to reach backend"}. Please check your backend URL configuration.`,
          status: "critical",
        },
      ]);

    } finally {
      setIsScanning(false);
    }
  };

  // Gatekeeper: Enforces corporate work email AND scan limit
  const handleScan = (
    domain: string,
    enablePhase2: boolean = true,
    customDorks: string[] = [],
    enabledVectors?: Record<string, boolean>
  ) => {
    // 1. Scan Limit Check (1 Free Scan per Day on Community plan)
    if (scanCount >= 1 && !isProMember) {
      setIsPaymentModalOpen(true);
      return;
    }

    const cleanTarget = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./, "");

    // 2. Corporate Work Email Match Check
    const isAuthorized =
      corporateSession &&
      (corporateSession.domain === cleanTarget ||
        corporateSession.email.endsWith(`@${cleanTarget}`) ||
        corporateSession.email.endsWith(`.${cleanTarget}`));

    if (!isAuthorized) {
      setAuthTargetDomain(cleanTarget || "reconflow.render.com");
      setPendingScan({
        domain: cleanTarget || "reconflow.render.com",
        enablePhase2,
        customDorks,
        enabledVectors,
      });
      setIsAuthModalOpen(true);
      return;
    }

    executeScanRequest(cleanTarget, enablePhase2, customDorks, enabledVectors);
  };

  const handleCorporateVerified = (session: CorporateSession) => {
    setCorporateSession(session);
    if (pendingScan && pendingScan.domain === session.domain) {
      executeScanRequest(
        pendingScan.domain,
        pendingScan.enablePhase2,
        pendingScan.customDorks,
        pendingScan.enabledVectors
      );
      setPendingScan(null);
    }
  };

  const handlePaymentSuccess = () => {
    setIsProMember(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("reconflow_pro", "true");
    }
    // Re-run pending scan if any
    if (pendingScan) {
      executeScanRequest(
        pendingScan.domain,
        pendingScan.enablePhase2,
        pendingScan.customDorks,
        pendingScan.enabledVectors
      );
      setPendingScan(null);
    }
  };

  const handleToggleLayout = () => {
    setLayoutDirection((prev) => (prev === "TB" ? "LR" : "TB"));
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

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ReconFlow_Dossier_${summary.target}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F7F7F5] flex flex-col font-mono selection:bg-[#B7E36A]/20 selection:text-[#B7E36A]">
      {/* Top Application Workspace Bar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded hover:bg-zinc-800/50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Landing</span>
            </Link>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-100 tracking-tight">
                RECONFLOW<span className="text-[#B7E36A]">.AI</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Pro Badge / Scan Counter */}
            {isProMember ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#B7E36A]/10 border border-[#B7E36A]/30 text-[#B7E36A] text-[10px] font-bold">
                <Zap className="w-3 h-3 fill-[#B7E36A]" />
                <span>PRO ACTIVE</span>
              </span>
            ) : (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/40 border border-amber-800/50 text-amber-300 text-[10px] font-bold hover:bg-amber-950/70 transition-all cursor-pointer"
              >
                <span>{scanCount >= 1 ? "Daily Limit Reached (1/1)" : "Free Scan Available (0/1)"}</span>
                <span className="text-[#B7E36A] underline">Upgrade</span>
              </button>
            )}

            {/* Export Dossier */}
            <button
              onClick={handleExportDossier}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md bg-[#121212] hover:bg-[#181818] text-zinc-200 border border-zinc-800 transition-all cursor-pointer"
              title="Download executive audit dossier markdown"
            >
              <Download className="w-3.5 h-3.5 text-[#B7E36A]" />
              <span className="hidden sm:inline">Export Dossier</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 pt-20 pb-16 px-4 max-w-7xl w-full mx-auto space-y-6">
        {/* Stripe Checkout Notification Banner */}
        {stripeBanner && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 font-mono text-xs transition-all ${
              stripeBanner.type === "success"
                ? "bg-[#0c1a0e] border-[#B7E36A]/50 text-zinc-200 shadow-lg shadow-[#B7E36A]/5"
                : "bg-amber-950/40 border-amber-800/60 text-amber-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {stripeBanner.type === "success" ? (
                <div className="w-8 h-8 rounded-lg bg-[#B7E36A]/20 border border-[#B7E36A]/40 flex items-center justify-center text-[#B7E36A] flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              <div>
                <div className="font-bold flex items-center gap-2">
                  <span>{stripeBanner.type === "success" ? "Payment Successful" : "Checkout Canceled"}</span>
                  {stripeBanner.sessionId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                      Ref: {stripeBanner.sessionId.slice(0, 16)}...
                    </span>
                  )}
                </div>
                <p className="text-zinc-400 font-sans text-xs mt-0.5">
                  {stripeBanner.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setStripeBanner(null)}
              className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded hover:bg-zinc-800/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workspace Title & Purpose */}
        <div className="max-w-3xl pt-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
            <span>Autonomous Reconnaissance // Live Canvas</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Interactive Attack-Surface Topology
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400 font-sans">
            Audit external perimeters, correlate multi-engine search dorks, inspect CVSS/OWASP vulnerability evidence, and execute defensive playbooks.
          </p>
        </div>

        {/* Corporate Work Email Session / Authorization Status Gate */}
        {!corporateSession ? (
          <div className="p-4 rounded-xl bg-[#0F0F0F] border border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-950/70 border border-amber-800/80 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-zinc-100 flex items-center gap-2">
                  <span>Protected Workspace: Corporate Work Email Required</span>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
                    Restricted Access
                  </span>
                </div>
                <p className="text-zinc-400 font-sans text-xs mt-0.5">
                  Public scanning is disabled to prevent unauthorized intelligence gathering. Audits are strictly restricted to verified employees of the target organization.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setAuthTargetDomain(initialTarget);
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-lg bg-[#B7E36A] hover:bg-[#a5cf5c] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap self-start sm:self-auto transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Corporate Email</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#0B150B] border border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs shadow-md">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300">
                Authorized Corporate Identity: <span className="text-emerald-400 font-bold">{corporateSession.email}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800/70">
                {corporateSession.companyName} Verified Staff
              </span>
              <span className="text-zinc-500 text-[11px]">| Target Perimeter: @{corporateSession.domain}</span>
            </div>
            <button
              onClick={() => setCorporateSession(null)}
              className="text-zinc-400 hover:text-zinc-200 text-[11px] flex items-center gap-1.5 cursor-pointer self-start sm:self-auto px-2 py-1 rounded hover:bg-zinc-800/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Company / Sign Out</span>
            </button>
          </div>
        )}

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
      </main>

      {/* Corporate Work Email Authentication Modal Gate */}
      <CorporateAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        targetDomain={authTargetDomain}
        onVerified={handleCorporateVerified}
      />

      {/* Mock Payment Checkout Modal (Hackathon Pro Activation) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        planName="Professional Tier (Unlimited Sweeps)"
        price="$49 / month"
      />
    </div>
  );
}

export default function ReconPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-[#B7E36A] border-t-transparent rounded-full animate-spin" />
            <span>Loading ReconFlow Workspace...</span>
          </div>
        </div>
      }
    >
      <ReconWorkspaceContent />
    </Suspense>
  );
}
