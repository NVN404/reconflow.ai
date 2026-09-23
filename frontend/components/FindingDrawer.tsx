import React, { useState } from "react";
import { X, ExternalLink, Copy, Check, ShieldAlert, Terminal, FileCode2, ArrowRight } from "lucide-react";
import { GraphNode } from "@/lib/types";

interface FindingDrawerProps {
  node: GraphNode | null;
  onClose: () => void;
}

export const FindingDrawer: React.FC<FindingDrawerProps> = ({ node, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!node) return null;

  const { data } = node;
  const isCritical = data.severity === "CRITICAL";
  const isHigh = data.severity === "HIGH";
  const isMedium = data.severity === "MEDIUM";
  const isNews = data.category === "NEWS_BREACH";
  const isYoutube = data.category === "YOUTUBE_POC";
  const isMobile = data.category === "MOBILE_APP";
  const isToken = data.category === "TOKEN_LEAK";
  const isDoc = data.category === "DOCUMENT_LEAK";

  let badgeText = `${data.severity} SEVERITY`;
  let badgeStyle = "bg-sky-500/20 text-sky-400 border-sky-500/40";
  if (isNews) {
    badgeText = "THREAT INTEL ADVISORY";
    badgeStyle = "bg-purple-500/20 text-purple-300 border-purple-500/40";
  } else if (isYoutube) {
    badgeText = "EXPLOIT POC RADAR";
    badgeStyle = "bg-rose-500/20 text-rose-300 border-rose-500/40";
  } else if (isMobile) {
    badgeText = "MOBILE CLIENT ASSET";
    badgeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  } else if (isToken) {
    badgeText = "CRITICAL TOKEN LEAK";
    badgeStyle = "bg-red-500/20 text-red-400 border-red-500/40";
  } else if (isDoc) {
    badgeText = "CONFIDENTIAL DOCUMENT";
    badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40";
  } else if (isCritical) {
    badgeText = "CRITICAL SEVERITY";
    badgeStyle = "bg-red-500/20 text-red-400 border-red-500/40";
  } else if (isHigh) {
    badgeText = "HIGH SEVERITY";
    badgeStyle = "bg-orange-500/20 text-orange-400 border-orange-500/40";
  } else if (isMedium) {
    badgeText = "MEDIUM SEVERITY";
    badgeStyle = "bg-amber-500/20 text-amber-400 border-amber-500/40";
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      {/* Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/50">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyle}`}
            >
              {badgeText}
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
              {data.surface}
            </span>
            {data.engine && (
              <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/50">
                ⚡ {data.engine}
              </span>
            )}
          </div>

          <h2 className="text-base font-bold text-slate-100 mt-2 leading-tight">
            {data.label}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
        {/* Compliance Tags */}
        {(data.owasp_tag || data.cwe_id) && (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Standards & Classification
            </p>
            {data.owasp_tag && (
              <p className="text-xs font-mono text-sky-400 font-medium">
                {data.owasp_tag}
              </p>
            )}
            {data.cwe_id && (
              <p className="text-xs font-mono text-slate-300">
                {data.cwe_id}
              </p>
            )}
          </div>
        )}

        {/* Verified Source URL */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Verified Source Endpoint
          </p>
          <a
            href={data.metadata?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 hover:border-sky-500/40 transition group font-mono text-xs break-all"
          >
            <span>{data.metadata?.url}</span>
            <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0 text-slate-500 group-hover:text-sky-400" />
          </a>
        </div>

        {/* Search Engine Snippet */}
        {data.metadata?.snippet && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Google Index Extracted Snippet
            </p>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-mono leading-relaxed bg-black/40">
              {data.metadata.snippet}
            </div>
          </div>
        )}

        {/* SerpApi Dork Query Used */}
        {data.metadata?.dork_used && data.metadata.dork_used !== "N/A" && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Exact Dork Operator Executed
            </p>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 font-mono text-xs">
              <span className="truncate">{data.metadata.dork_used}</span>
              <button
                onClick={() => handleCopy(data.metadata.dork_used)}
                className="p-1 text-slate-400 hover:text-slate-200"
                title="Copy Dork"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Actionable Defensive Remediation Directive or Threat Intel Action */}
        {data.remediation && (
          <div className="border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isNews ? "text-purple-400" : "text-emerald-400"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />{" "}
                {isNews ? "Threat Intelligence Context & Action" : "Defensive Remediation Playbook"}
              </span>
              <button
                onClick={() => handleCopy(data.remediation || "")}
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition font-medium ${
                  isNews
                    ? "bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Directive
                  </>
                )}
              </button>
            </div>

            <div
              className={`p-3.5 rounded-lg border font-mono text-xs leading-relaxed whitespace-pre-wrap shadow-inner ${
                isNews
                  ? "bg-slate-900 border-purple-500/20 text-slate-200 bg-purple-950/10"
                  : "bg-slate-900 border-emerald-500/20 text-slate-200 bg-emerald-950/10"
              }`}
            >
              {data.remediation}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
        <span>Engine: <strong className="text-slate-200 font-mono">{data.engine || "google"}</strong></span>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition font-medium"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
