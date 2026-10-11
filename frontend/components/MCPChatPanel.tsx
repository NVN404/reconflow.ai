"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Terminal,
  User,
} from "lucide-react";
import { ScanResult, GraphNode, AgentThought } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "agent" | "user" | "system";
  content: string;
  timestamp: string;
  // If the message contains structured findings
  findings?: GraphNode[];
  // For the initial scan summary
  scanSummary?: {
    target: string;
    securityScore: number;
    securityGrade: string;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
  };
  // Agent thought log entries
  thoughts?: AgentThought[];
  isStreaming?: boolean;
  tool_call?: {
    tool_name: string;
    engine?: string;
    query?: string;
    mode?: string;
    endpoint?: string;
  };
  mcpResultsCount?: number;
}

interface MCPChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isScanning: boolean;
  scanResult: ScanResult | null;
}

// ─── Severity Helpers ───────────────────────────────────────────────────────
const getSeverityConfig = (severity: string) => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return {
        color: "rose",
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
        bg: "bg-rose-500/10 dark:bg-rose-950/50",
        border: "border-rose-500/30 dark:border-rose-800/70",
        text: "text-rose-700 dark:text-rose-300",
        badge: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
        glow: "shadow-rose-500/10",
      };
    case "HIGH":
      return {
        color: "orange",
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        bg: "bg-orange-500/10 dark:bg-orange-950/50",
        border: "border-orange-500/30 dark:border-orange-800/70",
        text: "text-orange-700 dark:text-orange-300",
        badge: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
        glow: "shadow-orange-500/10",
      };
    case "MEDIUM":
      return {
        color: "amber",
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        bg: "bg-amber-500/10 dark:bg-amber-950/50",
        border: "border-amber-500/30 dark:border-amber-800/70",
        text: "text-amber-700 dark:text-amber-300",
        badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
        glow: "shadow-amber-500/10",
      };
    case "LOW":
      return {
        color: "slate",
        icon: <Info className="w-3.5 h-3.5" />,
        bg: "bg-slate-500/10 dark:bg-zinc-800/50",
        border: "border-slate-300 dark:border-zinc-700",
        text: "text-slate-700 dark:text-zinc-300",
        badge: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
        glow: "",
      };
    default:
      return {
        color: "emerald",
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
        bg: "bg-emerald-500/10 dark:bg-emerald-950/40",
        border: "border-emerald-500/30 dark:border-emerald-800/70",
        text: "text-emerald-700 dark:text-emerald-300",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        glow: "",
      };
  }
};

// ─── Finding Card Component ─────────────────────────────────────────────────
const FindingCard: React.FC<{ node: GraphNode; index: number; onAskAbout: (label: string) => void }> = ({
  node,
  index,
  onAskAbout,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data } = node;
  const config = getSeverityConfig(data.severity);
  const isClean = data.category === "VULN_STATUS_CLEAN";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} overflow-hidden transition-all duration-300 ${config.glow} shadow-sm hover:shadow-md`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`flex-shrink-0 ${config.text}`}>{config.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${config.badge} uppercase`}>
                {data.severity || "INFO"}
              </span>
              {data.category && (
                <span className="text-[9px] font-mono text-foreground-muted bg-surface-elevated border border-border px-1.5 py-0.5 rounded">
                  {data.category.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-foreground mt-1 truncate" title={data.label}>
              {data.label}
            </h4>
          </div>
        </div>
        <button className="text-foreground-muted hover:text-foreground transition p-1 flex-shrink-0">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-border/50 pt-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Proof Context */}
          {data.metadata?.snippet && (
            <div className="text-[11px] text-foreground-secondary font-sans leading-relaxed bg-background/60 p-2.5 rounded-lg border border-border/50">
              {data.metadata.snippet}
            </div>
          )}

          {/* What Was Detected */}
          {data.what_is_the_bug && (
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider">Detection</span>
              <p className="text-[11px] text-foreground-secondary font-sans leading-relaxed">{data.what_is_the_bug}</p>
            </div>
          )}

          {/* Why It Matters */}
          {data.why_it_is_a_bug && (
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider">Risk Analysis</span>
              <p className="text-[11px] text-foreground-secondary font-sans leading-relaxed">{data.why_it_is_a_bug}</p>
            </div>
          )}

          {/* Standards */}
          {(data.owasp_tag || data.cwe_id || data.cvss_score) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {data.owasp_tag && (
                <span className="text-[9px] font-mono text-emerald-700 dark:text-lime bg-emerald-50 dark:bg-lime/10 border border-emerald-200 dark:border-lime/30 px-1.5 py-0.5 rounded">
                  {data.owasp_tag}
                </span>
              )}
              {data.cwe_id && (
                <span className="text-[9px] font-mono text-foreground-secondary bg-surface-elevated border border-border px-1.5 py-0.5 rounded">
                  {data.cwe_id}
                </span>
              )}
              {data.cvss_score && (
                <span className="text-[9px] font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded">
                  CVSS {data.cvss_score}
                </span>
              )}
            </div>
          )}

          {/* URL + Actions */}
          <div className="flex items-center gap-2 pt-1">
            {data.metadata?.url && (
              <a
                href={data.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-lime hover:underline font-mono truncate max-w-[200px]"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{data.metadata.url}</span>
              </a>
            )}
            <div className="flex-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(data.metadata?.url || data.label);
              }}
              className="text-[10px] text-foreground-muted hover:text-foreground flex items-center gap-1 transition cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAskAbout(data.label);
              }}
              className="text-[10px] px-2 py-1 rounded bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25 transition cursor-pointer font-mono font-bold"
            >
              Ask AI →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Lightweight Markdown & Links Formatter ─────────────────────────────────
const renderFormattedText = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} className="h-1" />;
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ");
        const content = isBullet ? trimmed.replace(/^[•\-]\s*/, "") : line;

        const parseInline = (str: string) => {
          const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`|_.*?_)/g;
          const parts = str.split(regex);

          return parts.map((part, pIdx) => {
            if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
              const match = part.match(/\[(.*?)\]\((.*?)\)/);
              if (match) {
                return (
                  <a
                    key={pIdx}
                    href={match[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-0.5 mx-0.5"
                  >
                    <span>{match[1]}</span>
                    <ExternalLink className="w-2.5 h-2.5 inline-block opacity-75" />
                  </a>
                );
              }
            } else if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
              return (
                <strong key={pIdx} className="font-bold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              );
            } else if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
              return (
                <code
                  key={pIdx}
                  className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border text-purple-600 dark:text-purple-300 font-mono text-[11px] font-semibold"
                >
                  {part.slice(1, -1)}
                </code>
              );
            } else if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
              return (
                <em key={pIdx} className="italic text-foreground-secondary">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          });
        };

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-2 my-0.5">
              <span className="text-purple-500 font-bold leading-none select-none mt-1">•</span>
              <span className="flex-1">{parseInline(content)}</span>
            </div>
          );
        }

        return <div key={lIdx}>{parseInline(line)}</div>;
      })}
    </div>
  );
};

// ─── Main Chat Panel ────────────────────────────────────────────────────────
export const MCPChatPanel: React.FC<MCPChatPanelProps> = ({
  messages,
  onSendMessage,
  isScanning,
  scanResult,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isScanning) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleAskAbout = (label: string) => {
    const question = `Tell me more about the finding: "${label}" — what's the risk, how can it be exploited, and how do I fix it?`;
    onSendMessage(question);
  };

  const renderMessage = (msg: ChatMessage, idx: number) => {
    const isAgent = msg.role === "agent";
    const isUser = msg.role === "user";
    const isSystem = msg.role === "system";

    return (
      <div
        key={msg.id}
        className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2 duration-300`}
        style={{ animationDelay: `${idx * 40}ms` }}
      >
        {/* Avatar */}
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            {isSystem ? (
              <Terminal className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
        )}
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-lime/15 border border-lime/30 flex items-center justify-center text-lime">
            <User className="w-4 h-4" />
          </div>
        )}

        {/* Message Bubble */}
        <div className={`flex-1 max-w-[85%] ${isUser ? "text-right" : ""}`}>
          {/* Timestamp */}
          <div className={`flex items-center gap-1.5 mb-1 ${isUser ? "justify-end" : ""}`}>
            <span className="text-[9px] font-mono text-foreground-muted">
              {isAgent ? "ReconFlow AI (SerpApi MCP Agent)" : isUser ? "You" : "System"} · {msg.timestamp}
            </span>
            {msg.isStreaming && (
              <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
            )}
          </div>

          {/* Content Bubble */}
          <div
            className={`rounded-xl text-xs font-sans leading-relaxed ${
              isUser
                ? "bg-lime/10 border border-lime/30 text-foreground p-3.5 inline-block text-left"
                : isSystem
                ? "bg-surface-elevated border border-border text-foreground-secondary p-3 italic"
                : "bg-surface border border-border text-foreground-secondary p-3.5 shadow-sm"
            }`}
          >
            {/* Scan Summary Card (if present) */}
            {msg.scanSummary && (
              <div className="mb-3 p-3 rounded-lg bg-background/60 border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-foreground font-mono">
                    Scan Complete: {msg.scanSummary.target}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded bg-surface-elevated border border-border">
                    <div className={`text-lg font-black font-mono ${
                      msg.scanSummary.securityScore >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                      msg.scanSummary.securityScore >= 50 ? "text-amber-600 dark:text-amber-400" :
                      "text-rose-600 dark:text-rose-400"
                    }`}>
                      {msg.scanSummary.securityScore}
                    </div>
                    <div className="text-[9px] text-foreground-muted uppercase">Score</div>
                  </div>
                  <div className="text-center p-2 rounded bg-surface-elevated border border-border">
                    <div className={`text-lg font-black font-mono ${
                      msg.scanSummary.securityGrade === "A" ? "text-emerald-600 dark:text-emerald-400" :
                      msg.scanSummary.securityGrade === "B" ? "text-lime" :
                      msg.scanSummary.securityGrade === "C" ? "text-amber-600 dark:text-amber-400" :
                      "text-rose-600 dark:text-rose-400"
                    }`}>
                      {msg.scanSummary.securityGrade}
                    </div>
                    <div className="text-[9px] text-foreground-muted uppercase">Grade</div>
                  </div>
                  <div className="text-center p-2 rounded bg-surface-elevated border border-border">
                    <div className="text-lg font-black font-mono text-foreground">
                      {msg.scanSummary.criticalCount + msg.scanSummary.highCount + msg.scanSummary.mediumCount}
                    </div>
                    <div className="text-[9px] text-foreground-muted uppercase">Vulns</div>
                  </div>
                </div>
              </div>
            )}

            {/* Live SerpApi MCP Tool Execution Badge */}
            {msg.tool_call && (
              <div className="mb-3 rounded-xl border border-purple-500/40 bg-purple-950/20 dark:bg-purple-950/35 p-3 space-y-2 font-mono shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-purple-500" />
                      SerpApi MCP Tool Executed
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold">
                    JSON-RPC 2.0
                  </span>
                </div>

                <div className="bg-surface-elevated/90 rounded-lg p-2.5 border border-border space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2 text-foreground-secondary flex-wrap">
                    <span className="text-foreground-muted">Tool:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{msg.tool_call.tool_name}</span>
                    <span className="text-foreground-muted">|</span>
                    <span className="text-foreground-muted">Engine:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{msg.tool_call.engine || "google_light"}</span>
                    {msg.tool_call.mode && (
                      <>
                        <span className="text-foreground-muted">|</span>
                        <span className="text-foreground-muted">Mode:</span>
                        <span className="text-foreground font-mono">{msg.tool_call.mode}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-start gap-2 pt-0.5">
                    <span className="text-foreground-muted flex-shrink-0">Query:</span>
                    <span className="text-lime-700 dark:text-lime break-all font-semibold select-all bg-background/60 px-1.5 py-0.5 rounded border border-border/50">
                      {msg.tool_call.query}
                    </span>
                  </div>

                  {msg.tool_call.endpoint && (
                    <div className="text-[9px] text-foreground-muted flex items-center gap-1 pt-0.5">
                      <span>Endpoint:</span>
                      <span className="text-foreground-secondary truncate">{msg.tool_call.endpoint}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] pt-0.5">
                  <span className="text-foreground-muted">
                    Observations ingested: <strong className="text-foreground font-bold">{msg.mcpResultsCount ?? (msg.findings?.length || 0)}</strong>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Tool Call 200 OK
                  </span>
                </div>
              </div>
            )}

            {/* Text Content with Rich Formatting */}
            {renderFormattedText(msg.content)}

            {/* Findings Cards */}
            {msg.findings && msg.findings.length > 0 && (
              <div className="mt-3 space-y-2">
                {msg.findings.map((finding, fidx) => (
                  <FindingCard
                    key={finding.id}
                    node={finding}
                    index={fidx}
                    onAskAbout={handleAskAbout}
                  />
                ))}
              </div>
            )}

            {/* Thought Stream (compact) */}
            {msg.thoughts && msg.thoughts.length > 0 && (
              <div className="mt-3 space-y-1 p-2.5 rounded-lg bg-background/60 border border-border/50">
                <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> Agent Telemetry
                </span>
                {msg.thoughts.map((thought, tidx) => (
                  <div key={tidx} className="flex items-start gap-1.5 text-[10px]">
                    <span className="text-foreground-muted font-mono">[{thought.timestamp}]</span>
                    <span className={`font-bold px-1 rounded text-[9px] ${
                      thought.status === "critical" ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" :
                      thought.status === "warning" ? "bg-orange-500/15 text-orange-700 dark:text-orange-300" :
                      thought.status === "success" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
                      "bg-surface-elevated text-foreground-secondary"
                    }`}>
                      {thought.stage}
                    </span>
                    <span className="text-foreground-secondary flex-1">{thought.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[640px] rounded-xl border border-purple-500/30 dark:border-purple-500/20 bg-surface shadow-xl overflow-hidden font-mono transition-all duration-200">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-surface-elevated border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground">ReconFlow AI Agent</span>
            <span className="text-[9px] text-foreground-muted block">SerpApi MCP Protocol · Interactive Recon</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isScanning && (
            <span className="flex items-center gap-1.5 text-[10px] text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
              Scanning...
            </span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold">
            MCP
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        {messages.length === 0 && !isScanning && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-purple-500" />
            </div>
            <p className="text-sm font-bold text-foreground mb-1">MCP Agent Ready</p>
            <p className="text-xs text-foreground-secondary max-w-xs">
              Run a scan with SerpApi MCP protocol to start an interactive recon conversation. Results will appear as expandable finding cards.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => renderMessage(msg, idx))}

        {/* Streaming indicator */}
        {isScanning && (
          <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-border shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-purple-500/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-purple-500/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[11px] text-foreground-muted">Deploying MCP recon agents...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-surface-elevated">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about findings, request remediation advice, or dig deeper..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-purple-500 text-xs font-mono transition-all shadow-sm"
            disabled={isScanning}
          />
          <button
            type="submit"
            disabled={isScanning || !input.trim()}
            className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 px-1 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[9px] text-foreground-muted flex-shrink-0">Quick Tools:</span>
          {[
            "Check for leaked AWS S3 buckets",
            "Search for admin login portals",
            "Look for database backups or .env",
            "Summarize all critical exposures",
            "How do I fix top findings?",
          ].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSendMessage(q)}
              disabled={isScanning}
              className="text-[9px] px-2 py-0.5 rounded bg-surface border border-purple-500/20 text-foreground-muted hover:text-foreground hover:bg-purple-500/10 hover:border-purple-500/40 transition cursor-pointer disabled:opacity-40 whitespace-nowrap flex-shrink-0 font-mono"
            >
              {q}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};
