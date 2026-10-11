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
  Network,
  Bot,
} from "lucide-react";

import { SearchBar } from "@/components/SearchBar";
import { SummaryCards } from "@/components/SummaryCards";
import { GraphCanvas } from "@/components/GraphCanvas";
import { FindingDrawer } from "@/components/FindingDrawer";
import { ThoughtStream } from "@/components/ThoughtStream";
import { CorporateAuthModal } from "@/components/CorporateAuthModal";
import { PaymentModal } from "@/components/PaymentModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MCPChatPanel, ChatMessage } from "@/components/MCPChatPanel";
import { MCPFindingsSidebar } from "@/components/MCPFindingsSidebar";

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
    "ReconFlow AI Standing By. Enter any target perimeter (e.g. vulnweb.com) to initiate autonomous external reconnaissance.",
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

  const initialTarget = searchParams.get("target") || "vulnweb.com";

  const [scanResult, setScanResult] = useState<ScanResult>(initialScanResult);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB");
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Recon Protocol & Workspace View State
  // selectedProtocol: staged in SearchBar, controls active workspace mode directly
  const [selectedProtocol, setSelectedProtocol] = useState<"rest" | "mcp" | "both">("rest");
  // executedProtocol: protocol of the actual scan results currently active in memory
  const [executedProtocol, setExecutedProtocol] = useState<"rest" | "mcp" | "both" | null>(null);
  // displayMode: mirrors selectedProtocol so switching SearchBar buttons updates the workspace view immediately
  const displayMode = selectedProtocol;
  const [bothActiveView, setBothActiveView] = useState<"graph" | "chat">("graph");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Corporate Work Email Authentication State
  const [corporateSession, setCorporateSession] = useState<CorporateSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTargetDomain, setAuthTargetDomain] = useState<string>(initialTarget);
  const [pendingScan, setPendingScan] = useState<{
    domain: string;
    enablePhase2: boolean;
    customDorks: string[];
    enabledVectors?: Record<string, boolean>;
    protocol?: "rest" | "mcp" | "both";
  } | null>(null);

  // Pricing / Scan Limits (First Scan Free trial, paid plans unlock daily sweeps)
  const [scanCount, setScanCount] = useState<number>(0);
  const [isProMember, setIsProMember] = useState<boolean>(false);
  const [activePlanName, setActivePlanName] = useState<string>("Developer Plan");
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
      const storedPlan = localStorage.getItem("reconflow_plan") || "Developer Plan";
      const storedCount = parseInt(localStorage.getItem("reconflow_scan_count") || "0", 10);
      setIsProMember(storedPro);
      setActivePlanName(storedPlan);
      setScanCount(storedCount);

      // Handle Stripe Checkout Redirect Query Params
      const upgraded = searchParams.get("upgraded");
      const upgradedPlan = searchParams.get("plan");
      const sessionId = searchParams.get("session_id");
      const canceled = searchParams.get("canceled");
      const upgradeReq = searchParams.get("upgrade");

      if (upgraded === "true") {
        const planTitle = upgradedPlan ? decodeURIComponent(upgradedPlan) : "Developer Plan";
        setIsProMember(true);
        setActivePlanName(planTitle);
        localStorage.setItem("reconflow_pro", "true");
        localStorage.setItem("reconflow_plan", planTitle);
        setStripeBanner({
          type: "success",
          message: `Official Stripe Checkout successful! ${planTitle} unlocked with daily multi-engine sweeps.`,
          sessionId: sessionId || undefined,
        });
      } else if (canceled === "true") {
        setStripeBanner({
          type: "canceled",
          message: "Stripe checkout was canceled. You remain on the Free Community tier (1st scan free trial).",
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
  // ─── Build MCP chat messages from scan results ──────────────────────────
  const buildChatMessagesFromScan = (data: ScanResult, domain: string) => {
    const now = new Date().toLocaleTimeString("en-GB");
    const messages: ChatMessage[] = [];

    // 1. Scan initiation message
    messages.push({
      id: `scan-init-${Date.now()}`,
      role: "agent",
      content: `Deploying SerpApi MCP recon agents for target: ${domain}...`,
      timestamp: now,
      thoughts: data.thoughts?.slice(0, 5),
    });

    // 2. Executive summary + score card
    messages.push({
      id: `scan-summary-${Date.now()}`,
      role: "agent",
      content: data.executive_summary || `Scan complete for ${domain}. Here are the results:`,
      timestamp: now,
      scanSummary: {
        target: data.summary.target,
        securityScore: data.summary.security_score,
        securityGrade: data.summary.security_grade,
        criticalCount: data.summary.critical_risks,
        highCount: data.summary.high_risks,
        mediumCount: data.summary.medium_risks,
        lowCount: data.summary.low_risks,
        infoCount: data.summary.info,
      },
    });

    // 3. Critical & High findings as expandable cards
    const criticalFindings = data.nodes.filter(
      (n) => n.data.severity === "CRITICAL" || n.data.severity === "HIGH"
    );
    if (criticalFindings.length > 0) {
      messages.push({
        id: `scan-critical-${Date.now()}`,
        role: "agent",
        content: `🚨 Found ${criticalFindings.length} critical/high severity finding${criticalFindings.length > 1 ? "s" : ""} that require immediate attention:`,
        timestamp: now,
        findings: criticalFindings,
      });
    }

    // 4. Medium findings
    const mediumFindings = data.nodes.filter((n) => n.data.severity === "MEDIUM");
    if (mediumFindings.length > 0) {
      messages.push({
        id: `scan-medium-${Date.now()}`,
        role: "agent",
        content: `⚠️ ${mediumFindings.length} medium severity finding${mediumFindings.length > 1 ? "s" : ""} detected:`,
        timestamp: now,
        findings: mediumFindings,
      });
    }

    // 5. Clean / Info summary
    const cleanFindings = data.nodes.filter(
      (n) => n.data.category === "VULN_STATUS_CLEAN" || n.data.severity === "INFO" || n.data.severity === "LOW"
    );
    if (cleanFindings.length > 0) {
      messages.push({
        id: `scan-info-${Date.now()}`,
        role: "agent",
        content: `✅ ${cleanFindings.length} info/clean perimeter asset${cleanFindings.length > 1 ? "s" : ""} identified. These are low/no risk but documented for completeness.`,
        timestamp: now,
        findings: cleanFindings.slice(0, 6), // Limit to 6 to avoid clutter
      });
    }

    // 6. Closing prompt
    messages.push({
      id: `scan-close-${Date.now()}`,
      role: "agent",
      content: `Scan complete. You can ask me to explain any finding in detail, suggest remediation steps, or analyze attack vectors. Click "Ask AI →" on any finding card above, or type your question below.`,
      timestamp: now,
    });

    return messages;
  };

  // ─── Handle user chat follow-up messages via Autonomous MCP Agent ──────
  const handleChatMessage = async (message: string) => {
    const now = new Date().toLocaleTimeString("en-GB");

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: now,
    };

    // Pending agent message with dynamic thinking indicator
    const pendingId = `agent-pending-${Date.now()}`;
    const pendingMsg: ChatMessage = {
      id: pendingId,
      role: "agent",
      content: "Autonomous MCP Agent analyzing intent & formulating SerpApi MCP tool query...",
      timestamp: now,
      isStreaming: true,
    };

    setChatMessages((prev) => [...prev, userMsg, pendingMsg]);

    const target = scanResult?.summary?.target || initialTarget || "vulnweb.com";

    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const cleanApiUrl = rawApiUrl.replace(/\/+$/, "");
      const chatEndpoint = cleanApiUrl ? `${cleanApiUrl}/api/mcp/chat` : "/api/mcp/chat";

      const res = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: target,
          message,
          existing_nodes: scanResult?.nodes || [],
        }),
      });

      if (!res.ok) {
        throw new Error(`MCP Chat returned HTTP ${res.status}`);
      }

      const data = await res.json();

      const newAgentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: data.reply || "Recon investigation complete.",
        timestamp: new Date().toLocaleTimeString("en-GB"),
        findings: data.findings && data.findings.length > 0 ? data.findings : undefined,
        tool_call: data.tool_call || undefined,
        mcpResultsCount: data.mcp_results_count,
        thoughts: data.thought
          ? [
              {
                timestamp: new Date().toLocaleTimeString("en-GB"),
                stage: data.tool_call ? "MCP_TOOL_EXEC" : "MCP_REASONING",
                message: data.thought,
                status: data.tool_call ? "success" : "info",
              },
            ]
          : undefined,
      };

      // Replace pending message with completed agent response
      setChatMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? newAgentMsg : m))
      );

      // If new findings discovered by the live tool call, integrate them into workspace scanResult
      if (data.findings && data.findings.length > 0) {
        setScanResult((prev) => {
          const existingIds = new Set(prev.nodes.map((n) => n.id));
          const uniqueNewNodes = data.findings.filter((n: GraphNode) => !existingIds.has(n.id));
          if (uniqueNewNodes.length === 0) return prev;

          return {
            ...prev,
            nodes: [...prev.nodes, ...uniqueNewNodes],
            summary: {
              ...prev.summary,
              total_nodes: (prev.summary.total_nodes || 0) + uniqueNewNodes.length,
            },
          };
        });
      }
    } catch (err: any) {
      console.warn("MCP Agent backend call failed, falling back to local context:", err);
      // Fallback gracefully to local context generator if offline
      const aiResponse = generateChatResponse(message, scanResult);
      const fallbackMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: aiResponse.text,
        timestamp: new Date().toLocaleTimeString("en-GB"),
        findings: aiResponse.relevantFindings,
      };
      setChatMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? fallbackMsg : m))
      );
    }
  };

  // ─── AI response generator (local, from scan context) ───────────────────
  const generateChatResponse = (
    query: string,
    result: ScanResult
  ): { text: string; relevantFindings?: GraphNode[] } => {
    const q = query.toLowerCase();
    const nodes = result?.nodes || [];

    // Finding-specific queries
    const matchedFindings = nodes.filter((n) => {
      const label = n.data.label?.toLowerCase() || "";
      const category = n.data.category?.toLowerCase() || "";
      const surface = n.data.surface?.toLowerCase() || "";
      return (
        q.includes(label.slice(0, 20)) ||
        (q.includes("s3") && (category.includes("s3") || label.includes("s3"))) ||
        (q.includes("github") && (category.includes("github") || label.includes("github"))) ||
        (q.includes("bucket") && (category.includes("s3") || label.includes("bucket"))) ||
        (q.includes("token") && (category.includes("token") || label.includes("token"))) ||
        (q.includes("api") && (category.includes("api") || label.includes("api"))) ||
        (q.includes("youtube") && category.includes("youtube")) ||
        (q.includes("news") && category.includes("news")) ||
        (q.includes("mobile") && category.includes("mobile")) ||
        (q.includes("header") && (category.includes("header") || label.includes("header"))) ||
        (q.includes("dns") && (category.includes("dns") || label.includes("dns"))) ||
        (q.includes("email") && (category.includes("email") || label.includes("email")))
      );
    });

    if (matchedFindings.length > 0) {
      const f = matchedFindings[0].data;
      const parts: string[] = [];
      parts.push(`Here's what I know about "${f.label}":\n`);
      if (f.what_is_the_bug) parts.push(`🔍 **Detection:** ${f.what_is_the_bug}`);
      if (f.why_it_is_a_bug) parts.push(`⚠️ **Risk:** ${f.why_it_is_a_bug}`);
      if (f.attack_vector) parts.push(`🎯 **Attack Vector:** ${f.attack_vector}`);
      if (f.how_to_fix || f.remediation) parts.push(`🛡️ **Remediation:** ${f.how_to_fix || f.remediation}`);
      if (f.remediation_steps && f.remediation_steps.length > 0) {
        parts.push(`\n📋 **Action Steps:**\n${f.remediation_steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);
      }
      if (f.owasp_tag) parts.push(`\n📌 Standard: ${f.owasp_tag}${f.cwe_id ? ` | ${f.cwe_id}` : ""}${f.cvss_score ? ` | CVSS ${f.cvss_score}` : ""}`);
      return { text: parts.join("\n\n"), relevantFindings: matchedFindings };
    }

    // Summary queries
    if (q.includes("critical") || q.includes("summarize")) {
      const criticals = nodes.filter((n) => n.data.severity === "CRITICAL");
      if (criticals.length === 0) {
        return { text: "No critical severity findings were detected in this scan. The perimeter looks relatively secure at the critical level." };
      }
      const summary = criticals.map((n) => `• **${n.data.label}** — ${n.data.what_is_the_bug || n.data.metadata?.snippet || "Detected"}`).join("\n");
      return {
        text: `Found ${criticals.length} critical finding${criticals.length > 1 ? "s" : ""}:\n\n${summary}\n\nClick on any finding card to see full details, or ask me about a specific one.`,
        relevantFindings: criticals,
      };
    }

    if (q.includes("fix") || q.includes("remediat") || q.includes("patch")) {
      const vulns = nodes.filter((n) => n.data.severity === "CRITICAL" || n.data.severity === "HIGH");
      if (vulns.length === 0) {
        return { text: "No critical or high severity vulnerabilities found that need immediate remediation." };
      }
      const topVuln = vulns[0].data;
      const steps = topVuln.remediation_steps?.map((s, i) => `${i + 1}. ${s}`).join("\n") || "No specific steps available.";
      return {
        text: `Top priority fix — **${topVuln.label}** (${topVuln.severity}):\n\n🛡️ ${topVuln.how_to_fix || topVuln.remediation || "Apply security hardening."}\n\n📋 Steps:\n${steps}`,
        relevantFindings: [vulns[0]],
      };
    }

    if (q.includes("attack") || q.includes("vector") || q.includes("exploit")) {
      const withVectors = nodes.filter((n) => n.data.attack_vector);
      if (withVectors.length === 0) {
        return { text: "No documented attack vectors found in this scan's findings." };
      }
      const vectors = withVectors.slice(0, 3).map((n) => `• **${n.data.label}:** ${n.data.attack_vector}`).join("\n\n");
      return {
        text: `Known attack vectors from this scan:\n\n${vectors}`,
        relevantFindings: withVectors.slice(0, 3),
      };
    }

    if (q.includes("high")) {
      const highs = nodes.filter((n) => n.data.severity === "HIGH");
      return {
        text: highs.length > 0
          ? `Found ${highs.length} high severity finding${highs.length > 1 ? "s" : ""}. Expand the cards below for details:`
          : "No high severity findings detected.",
        relevantFindings: highs.length > 0 ? highs : undefined,
      };
    }

    if (q.includes("medium")) {
      const meds = nodes.filter((n) => n.data.severity === "MEDIUM");
      return {
        text: meds.length > 0
          ? `Found ${meds.length} medium severity finding${meds.length > 1 ? "s" : ""}:`
          : "No medium severity findings detected.",
        relevantFindings: meds.length > 0 ? meds : undefined,
      };
    }

    if (q.includes("low") || q.includes("info") || q.includes("clean") || q.includes("asset")) {
      const infos = nodes.filter((n) => n.data.severity === "LOW" || n.data.severity === "INFO" || n.data.category === "VULN_STATUS_CLEAN");
      return {
        text: infos.length > 0
          ? `${infos.length} low/info-level assets found across the perimeter:`
          : "No info-level assets in this scan.",
        relevantFindings: infos.length > 0 ? infos.slice(0, 6) : undefined,
      };
    }

    // Default fallback
    const totalVulns = result.summary.critical_risks + result.summary.high_risks + result.summary.medium_risks;
    return {
      text: `Based on the scan of **${result.summary.target}**, I found ${totalVulns} vulnerabilities (${result.summary.critical_risks} critical, ${result.summary.high_risks} high, ${result.summary.medium_risks} medium) across ${result.summary.total_nodes} nodes.\n\nSecurity Score: **${result.summary.security_score}/100** (Grade ${result.summary.security_grade}).\n\nYou can ask me about specific findings, request remediation advice, or explore attack vectors. Try:\n• "Summarize all critical findings"
• "How do I fix the top vulnerability?"
• "What attack vectors exist?"`,
    };
  };

  const executeScanRequest = async (
    domain: string,
    enablePhase2: boolean = true,
    customDorks: string[] = [],
    enabledVectors?: Record<string, boolean>,
    protocol: "rest" | "mcp" | "both" = "rest"
  ) => {
    setIsScanning(true);
    setSelectedNode(null);
    setExecutedProtocol(protocol);

    // If MCP or Both, add an initial chat message; if REST, clear previous chat messages
    if (protocol === "mcp" || protocol === "both") {
      setChatMessages([{
        id: `system-init-${Date.now()}`,
        role: "system",
        content: `Initializing ${protocol === "both" ? "Dual Engine (REST + SerpApi MCP)" : "SerpApi MCP"} Protocol scan for ${domain}...`,
        timestamp: new Date().toLocaleTimeString("en-GB"),
      }]);
    } else {
      setChatMessages([]);
    }

    const startTime = new Date().toLocaleTimeString("en-GB");
    const protoLabel = protocol === "both" ? "Dual Engine (REST + MCP)" : protocol === "mcp" ? "SerpApi MCP Protocol" : "Direct REST";
    setThoughts([
      {
        timestamp: startTime,
        stage: "DISPATCH",
        message: `Deploying live SerpApi multi-engine recon agent for target: ${domain} via ${protoLabel}...`,
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

        // If MCP or Both protocol, build chat messages from scan results; otherwise keep chat clean
        if (protocol === "mcp" || protocol === "both") {
          const chatMsgs = buildChatMessagesFromScan(data, domain);
          setChatMessages(chatMsgs);
        } else {
          setChatMessages([]);
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
      const errorMsg = `Scan error: ${err?.message || "Failed to reach backend"}. Please check your backend URL configuration.`;
      setThoughts((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString("en-GB"),
          stage: "ERROR",
          message: errorMsg,
          status: "critical",
        },
      ]);

      // If MCP or Both, add error to chat
      if (protocol === "mcp" || protocol === "both") {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "agent",
            content: `❌ ${errorMsg}`,
            timestamp: new Date().toLocaleTimeString("en-GB"),
          },
        ]);
      }
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
    protocol: "rest" | "mcp" | "both" = "rest"
  ) => {
    const cleanTarget = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./, "");

    // 1. Strict Scan Limit Check (1 Free Scan per Day on Community plan)
    if (scanCount >= 1 && !isProMember) {
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
      setAuthTargetDomain(cleanTarget || "vulnweb.com");
      setPendingScan({
        domain: cleanTarget || "vulnweb.com",
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
    if (scanCount >= 1 && !isProMember) {
      setIsPaymentModalOpen(true);
      return;
    }
    const targetToScan = session.domain || pendingScan?.domain || "vulnweb.com";
    executeScanRequest(
      targetToScan,
      pendingScan?.enablePhase2 ?? true,
      pendingScan?.customDorks ?? [],
      pendingScan?.enabledVectors,
      pendingScan?.protocol || selectedProtocol
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
        pendingScan.protocol || selectedProtocol
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
                <span>{activePlanName.toUpperCase().replace(" PLAN", "")} ACTIVE</span>
              </span>
            ) : (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 dark:bg-amber-950/40 border border-amber-500/30 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-500/25 transition-all cursor-pointer"
              >
                <span>{scanCount >= 1 ? "1st Scan Used (1/1)" : "1st Scan Free (0/1)"}</span>
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
        <SearchBar
          onScan={handleScan}
          isScanning={isScanning}
          protocol={selectedProtocol}
          onProtocolChange={(p) => {
            setSelectedProtocol(p);
          }}
          isLimitReached={scanCount >= 1 && !isProMember}
          onUpgradeClick={() => setIsPaymentModalOpen(true)}
        />

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

        {/* Metric Summary Cards (Shown for REST and Both modes) */}
        {displayMode !== "mcp" && scanResult?.summary && (
          <SummaryCards
            summary={scanResult.summary}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        )}

        {/* Conditional Workspace Engine Views (Strict Mode Isolation) */}
        {displayMode === "both" ? (
          <>
            {/* THIRD OPTION: RUN BOTH (DUAL HYBRID MODE) - Includes View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl bg-surface border border-cyan-500/30 shadow-sm">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBothActiveView("graph")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    bothActiveView === "graph"
                      ? "bg-surface-elevated text-foreground border border-border shadow-sm ring-1 ring-border"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface-elevated/50 border border-transparent"
                  }`}
                >
                  <Network className="w-3.5 h-3.5 text-lime" />
                  <span>Interactive Topology Graph</span>
                  {scanResult?.nodes?.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-foreground-muted">
                      {scanResult.nodes.length} nodes
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBothActiveView("chat");
                    if (chatMessages.length === 0 && scanResult?.nodes?.length > 0 && scanResult?.summary?.protocol_used === "both") {
                      setChatMessages(buildChatMessagesFromScan(scanResult, scanResult.summary.target));
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    bothActiveView === "chat"
                      ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/40 shadow-sm ring-1 ring-purple-500/30"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface-elevated/50 border border-transparent"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-purple-500" />
                  <span>SerpApi MCP AI Chat Digest</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
                    Chat Interface
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-spin" style={{ animationDuration: "6s" }} />
                <span>
                  {scanResult?.summary?.protocol_used === "both"
                    ? "Dual Protocol Active · Both Graph & AI Chat Enabled (~2x Credits)"
                    : "Dual Protocol Mode Selected · Both Graph & AI Chat Tabs Available"}
                </span>
              </div>
            </div>

            {/* Render Dual Mode Active Tab */}
            {bothActiveView === "chat" ? (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3">
                  <MCPChatPanel
                    messages={chatMessages}
                    onSendMessage={handleChatMessage}
                    isScanning={isScanning}
                    scanResult={scanResult}
                  />
                </div>
                <div className="lg:col-span-2">
                  <MCPFindingsSidebar
                    summary={scanResult?.summary?.total_nodes > 0 ? scanResult.summary : null}
                    onAskAbout={handleChatMessage}
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <GraphCanvas
                  nodes={layoutedNodes}
                  edges={layoutedEdges}
                  onNodeClick={setSelectedNode}
                  selectedNodeId={selectedNode?.id}
                  layoutDirection={layoutDirection}
                  onToggleLayout={handleToggleLayout}
                />
                <FindingDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
              </div>
            )}
          </>
        ) : displayMode === "mcp" ? (
          <>
            {/* OPTION 2: SERPAPI MCP ONLY - AI CHAT DIGEST ONLY (No Graph, No Switcher) */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-purple-700 dark:text-purple-300">
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-purple-500" />
                <span className="font-bold">SerpApi MCP Server Mode Active</span>
                <span className="hidden sm:inline text-[11px] text-foreground-muted">· Conversational AI Digest (-60% tokens)</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedProtocol !== "mcp" && executedProtocol === "mcp" && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Staged: {selectedProtocol === "both" ? "Dual Mode" : "Direct REST"} (Click Execute to run)
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 font-bold border border-purple-500/40">
                  MCP Chat Only
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <MCPChatPanel
                  messages={chatMessages}
                  onSendMessage={handleChatMessage}
                  isScanning={isScanning}
                  scanResult={scanResult}
                />
              </div>
              <div className="lg:col-span-2">
                <MCPFindingsSidebar
                  summary={
                    scanResult?.summary?.protocol_used === "mcp" && (scanResult?.summary?.total_nodes ?? 0) > 0
                      ? scanResult.summary
                      : null
                  }
                  onAskAbout={handleChatMessage}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* OPTION 1: DIRECT REST API ONLY - TOPOLOGY GRAPH CANVAS ONLY (No Chat, No Switcher) */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-foreground-secondary">
              <div className="flex items-center gap-2.5">
                <Network className="w-4 h-4 text-lime" />
                <span className="font-bold text-foreground">Direct REST Mode Active</span>
                <span className="hidden sm:inline text-[11px] text-foreground-muted">· Interactive Node Topology Canvas (Raw JSON)</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedProtocol !== "rest" && executedProtocol === "rest" && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Staged: {selectedProtocol === "both" ? "Dual Mode" : "SerpApi MCP"} (Click Execute to run)
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground-muted font-bold">
                  REST Graph Only
                </span>
              </div>
            </div>

            <div className="relative">
              <GraphCanvas
                nodes={layoutedNodes}
                edges={layoutedEdges}
                onNodeClick={setSelectedNode}
                selectedNodeId={selectedNode?.id}
                layoutDirection={layoutDirection}
                onToggleLayout={handleToggleLayout}
              />
              <FindingDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
            </div>
          </>
        )}

        {/* Autonomous Agent Thought Stream (Only for Direct REST and Both modes, NEVER for MCP mode) */}
        {displayMode !== "mcp" && (
          <ThoughtStream thoughts={thoughts} isScanning={isScanning} />
        )}
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
        planName={activePlanName || "Developer Plan"}
        price="$99 / month"
        amountCents={9900}
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
