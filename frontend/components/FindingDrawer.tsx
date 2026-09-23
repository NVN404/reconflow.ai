import React, { useState } from "react";
import { X, ExternalLink, Copy, Check, ShieldAlert } from "lucide-react";
import { GraphNode } from "@/lib/types";

interface FindingDrawerProps {
  node: GraphNode | null;
  onClose: () => void;
}

const getDrawerBadgeStyles = (severity: string, isNews: boolean) => {
  if (isNews) {
    return {
      label: "Threat Intel Advisory",
      class: "bg-[#281b3b] text-[#c084fc]",
    };
  }
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return {
        label: "Critical Severity",
        class: "bg-[#3a1418] text-[#ff6b6a]",
      };
    case "HIGH":
      return {
        label: "High Severity",
        class: "bg-[#3a2013] text-[#ff9d6b]",
      };
    case "MEDIUM":
      return {
        label: "Medium Severity",
        class: "bg-[#3a2b0a] text-[#ffc26b]",
      };
    case "LOW":
      return {
        label: "Low Severity",
        class: "bg-[#0f2e22] text-[#4ade9b]",
      };
    default:
      return {
        label: "Info Severity",
        class: "bg-[#10253d] text-[#6fb2f5]",
      };
  }
};

export const FindingDrawer: React.FC<FindingDrawerProps> = ({ node, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!node) return null;

  const { data } = node;
  const isNews = data.category === "NEWS_BREACH";
  const badgeStyle = getDrawerBadgeStyles(data.severity, isNews);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#141a24] border-l border-white/[0.08] shadow-2xl z-50 flex flex-col transition-all duration-300 ease-out animate-in slide-in-from-right font-sans">
      {/* Header */}
      <div className="p-5 border-b border-white/[0.06] flex items-start justify-between bg-[#161c28]">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-md ${badgeStyle.class}`}
            >
              {badgeStyle.label}
            </span>
            <span className="text-xs font-medium text-slate-400 px-2 py-0.5 rounded bg-[#0d1117]">
              {data.surface}
            </span>
          </div>

          <h2 className="text-base font-semibold text-slate-100 mt-2.5 leading-snug">
            {data.label}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1a2230] transition active:scale-95 cursor-pointer"
          title="Close drawer"
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
