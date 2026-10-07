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
import { ThemeToggle } from "@/components/ThemeToggle";

import { getLayoutedElements } from "@/lib/layout";
import { ScanResult, GraphNode, AgentThought } from "@/lib/types";
import { generateAuditDossier } from "@/lib/dossier";

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
    "ReconFlow AI Standing By. Enter any target perimeter (e.g. reconflow.render.com) to initiate autonomous external reconnaissance.",
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
    protocol?: "rest" | "mcp";
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
      message: "ReconFlow AI Autonomous Recon Agent initialized. Standing by for target perimeter.",
      status: "info",
    },
    {
      timestamp: "READY",
      stage: "READY",
      message: "Autonomous passive external reconnaissance engine armed.",
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
    if (activeFilter === "VULNERABILITIES") {
      filteredNodes = scanResult.nodes.filter(
        (n) => n.data.severity === "CRITICAL" || n.data.severity === "HIGH" || n.data.severity === "MEDIUM"
      );
    } else if (activeFilter === "CRITICAL") {
      filteredNodes = scanResult.nodes.filter((n) => n.data.severity === "CRITICAL");
    } else if (activeFilter === "HIGH") {
      filteredNodes = scanResult.nodes.filter((n) => n.data.severity === "HIGH");
    } else if (activeFilter === "MEDIUM") {
      filteredNodes = scanResult.nodes.filter((n) => n.data.severity === "MEDIUM");
    } else if (activeFilter === "ASSETS" || activeFilter === "LOW") {
      filteredNodes = scanResult.nodes.filter(
        (n) => n.type === "rootNode" || n.type === "subdomainNode"
      );
    } else if (activeFilter === "RADAR" || activeFilter === "THREAT_RADAR") {
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
    enabledVectors?: Record<string, boolean>,
    protocol: "rest" | "mcp" = "rest"
  ) => {
    setIsScanning(true);
    setSelectedNode(null);

    const startTime = new Date().toLocaleTimeString("en-GB");
    setThoughts([
      {
        timestamp: startTime,
        stage: "DISPATCH",
        message: `Deploying live SerpApi multi-engine recon agent for target: ${domain} via ${protocol === "mcp" ? "SerpApi MCP Protocol" : "Direct REST"}...`,
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
          protocol,
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
    enabledVectors?: Record<string, boolean>,
    protocol: "rest" | "mcp" = "rest"
  ) => {
    const cleanTarget = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./, "");

    // 1. Scan Limit Check (1 Free Scan per Day on Community plan, demo testbed exempt)
    if (
      scanCount >= 1 &&
      !isProMember &&
      cleanTarget !== "vulnweb.com" &&
      cleanTarget !== "reconflow.render.com"
    ) {
      setIsPaymentModalOpen(true);
      return;
    }

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
        protocol,
      });
      setIsAuthModalOpen(true);
      return;
    }

    executeScanRequest(cleanTarget, enablePhase2, customDorks, enabledVectors, protocol);
  };

  const handleCorporateVerified = (session: CorporateSession) => {
    setCorporateSession(session);
    const targetToScan = session.domain || pendingScan?.domain || "reconflow.render.com";
    executeScanRequest(
      targetToScan,
      pendingScan?.enablePhase2 ?? true,
      pendingScan?.customDorks ?? [],
      pendingScan?.enabledVectors,
      pendingScan?.protocol || "rest"
    );
    setPendingScan(null);
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
        pendingScan.enabledVectors,
        pendingScan.protocol || "rest"
      );
      setPendingScan(null);
    }
  };

  const handleToggleLayout = () => {
    setLayoutDirection((prev) => (prev === "TB" ? "LR" : "TB"));
  };

  const handleExportDossier = () => {
    if (!scanResult || scanResult.nodes.length === 0) return;
    const md = generateAuditDossier(scanResult);

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ReconFlow_Dossier_${scanResult.summary.target || "audit"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono selection:bg-lime/20 selection:text-lime transition-colors duration-200">
      {/* Top Application Workspace Bar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground transition-colors p-1 rounded hover:bg-surface-elevated"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Landing</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground tracking-tight">
                RECONFLOW<span className="text-lime">.AI</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground-muted">
                Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Pro Badge / Scan Counter */}
            {isProMember ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-lime/15 border border-lime/30 text-lime text-[10px] font-bold">
                <Zap className="w-3 h-3 fill-lime" />
                <span>PRO ACTIVE</span>
              </span>
            ) : (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 dark:bg-amber-950/40 border border-amber-500/30 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-500/25 transition-all cursor-pointer"
              >
                <span>{scanCount >= 1 ? "Daily Limit Reached (1/1)" : "Free Scan Available (0/1)"}</span>
                <span className="text-lime underline">Upgrade</span>
              </button>
            )}

            {/* Theme Toggle (Light / Dark mode) */}
            <ThemeToggle />

            {/* Export Dossier */}
            <button
              onClick={handleExportDossier}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated text-foreground border border-border shadow-sm transition-all cursor-pointer"
              title="Download executive audit dossier markdown"
            >
              <Download className="w-3.5 h-3.5 text-lime" />
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
          <div className="inline-flex items-center gap-2 text-xs font-mono text-foreground-muted uppercase tracking-wider mb-2">
            <span>Autonomous Reconnaissance // Live Canvas</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Interactive Attack-Surface Topology
          </h1>
          <p className="mt-1.5 text-xs text-foreground-secondary font-sans">
            Audit external perimeters, correlate multi-engine search dorks, inspect CVSS/OWASP vulnerability evidence, and execute defensive playbooks.
          </p>
        </div>

        {/* Corporate Work Email Session / Authorization Status Gate */}
        {!corporateSession ? (
          <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-[#0F0F0F] border border-amber-500/30 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 dark:bg-amber-950/70 border border-amber-500/40 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-foreground flex items-center gap-2">
                  <span>Protected Workspace: Corporate Work Email Required</span>
                  <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-800 px-2 py-0.5 rounded font-mono">
                    Restricted Access
                  </span>
                </div>
                <p className="text-foreground-secondary font-sans text-xs mt-0.5">
                  Public scanning is disabled to prevent unauthorized intelligence gathering. Audits are strictly restricted to verified employees of the target organization.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setAuthTargetDomain(initialTarget);
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-lg bg-lime hover:opacity-90 text-background font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap self-start sm:self-auto transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Corporate Email</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-[#0B150B] border border-emerald-500/30 dark:border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-foreground">
                Authorized Corporate Identity: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{corporateSession.email}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-800/70">
                {corporateSession.companyName} Verified Staff
              </span>
              <span className="text-foreground-muted text-[11px]">| Target Perimeter: @{corporateSession.domain}</span>
            </div>
            <button
              onClick={() => setCorporateSession(null)}
              className="text-foreground-secondary hover:text-foreground text-[11px] flex items-center gap-1.5 cursor-pointer self-start sm:self-auto px-2 py-1 rounded hover:bg-surface-elevated transition-colors"
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
          <div className="p-4 rounded-lg bg-surface border border-border flex items-start gap-3.5 shadow-sm font-mono text-xs">
            <div className="p-2 rounded bg-surface-elevated text-foreground-secondary mt-0.5 border border-border">
              <Sparkles className="w-4 h-4 text-lime" />
            </div>
            <div className="flex-1 leading-relaxed text-foreground-secondary font-sans">
              <span className="font-bold text-foreground block mb-1 font-mono uppercase tracking-wider text-[11px]">
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

      {/* Stripe Payment Checkout Modal */}
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
        <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs text-foreground-muted">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-lime border-t-transparent rounded-full animate-spin" />
            <span>Loading ReconFlow Workspace...</span>
          </div>
        </div>
      }
    >
      <ReconWorkspaceContent />
    </Suspense>
  );
}
