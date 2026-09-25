import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  BookOpen,
  Bug,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { GraphNode } from "@/lib/types";

interface FindingDrawerProps {
  node: GraphNode | null;
  onClose: () => void;
}

const getDrawerBadgeStyles = (
  severity: string,
  isNews: boolean,
  isClean: boolean,
  isYoutube: boolean,
  isMobile: boolean,
  isToken: boolean,
  isDoc: boolean,
  isResource: boolean
) => {
  if (isClean) {
    return {
      label: "Perimeter Secure",
      class: "bg-[#0f2e22] text-[#4ade9b] border border-[#4ade9b]/30",
    };
  }
  if (isResource) {
    return {
      label: "Research Resource",
      class: "bg-[#281b3b] text-[#c084fc] border border-[#c084fc]/30",
    };
  }
  if (isNews) {
    return {
      label: "Threat Intel Advisory",
      class: "bg-[#281b3b] text-[#c084fc] border border-[#c084fc]/30",
    };
  }
  if (isYoutube) {
    return {
      label: "Researcher PoC Radar",
      class: "bg-[#1e1b4b] text-[#818cf8] border border-[#818cf8]/30",
    };
  }
  if (isMobile) {
    return {
      label: "Mobile Client Asset",
      class: "bg-[#0f2e22] text-[#4ade9b] border border-[#4ade9b]/30",
    };
  }
  if (isToken) {
    return {
      label: "Critical Token Leak",
      class: "bg-[#3a1418] text-[#ff6b6a] border border-[#ff6b6a]/30",
    };
  }
  if (isDoc) {
    return {
      label: "Confidential Document",
      class: "bg-[#3a2b0a] text-[#ffc26b] border border-[#ffc26b]/30",
    };
  }

  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return {
        label: "Critical Severity",
        class: "bg-[#3a1418] text-[#ff6b6a] border border-[#ff6b6a]/30",
      };
    case "HIGH":
      return {
        label: "High Severity",
        class: "bg-[#3a2013] text-[#ff9d6b] border border-[#ff9d6b]/30",
      };
    case "MEDIUM":
      return {
        label: "Medium Severity",
        class: "bg-[#3a2b0a] text-[#ffc26b] border border-[#ffc26b]/30",
      };
    case "LOW":
      return {
        label: "Low Severity",
        class: "bg-[#0f2e22] text-[#4ade9b] border border-[#4ade9b]/30",
      };
    default:
      return {
        label: "Info Severity",
        class: "bg-[#10253d] text-[#6fb2f5] border border-[#6fb2f5]/30",
      };
  }
};

export const FindingDrawer: React.FC<FindingDrawerProps> = ({ node, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!node) return null;

  const { data } = node;
  const isClean = data.category === "VULN_STATUS_CLEAN";
  const isCritical = data.severity === "CRITICAL" && !isClean;
  const isNews = data.category === "NEWS_BREACH";
  const isYoutube = data.category === "YOUTUBE_POC";
  const isMobile = data.category === "MOBILE_APP";
  const isToken = data.category === "TOKEN_LEAK";
  const isDoc = data.category === "DOCUMENT_LEAK";
  const isResource = data.category === "RESOURCE" || data.section === "RESOURCE";
  const isVulnSection = data.section === "VULNERABILITY" && !isClean;

  const badgeStyle = getDrawerBadgeStyles(
    data.severity,
    isNews,
    isClean,
    isYoutube,
    isMobile,
    isToken,
    isDoc,
    isResource
  );

  const sectionName = isVulnSection
    ? "🚨 VULNERABILITY SECTION"
    : isResource
    ? "📚 OSINT RESEARCH RESOURCE"
    : "🛡️ ASSETS & INTEL SECTION";
  const sectionStyle = isVulnSection
    ? "bg-[#3a1418] text-[#ff6b6a]"
    : isResource
    ? "bg-[#281b3b] text-[#c084fc]"
    : "bg-[#10253d] text-[#6fb2f5]";

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#121721] border-l border-white/[0.08] shadow-2xl z-50 flex flex-col transition-all duration-300 ease-out animate-in slide-in-from-right font-sans">
      {/* Header */}
      <div className="p-5 border-b border-white/[0.06] flex items-start justify-between bg-[#161c28]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badgeStyle.class}`}>
              {badgeStyle.label}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${sectionStyle}`}>
              {sectionName}
            </span>
            <span className="text-xs font-medium text-slate-400 px-2 py-0.5 rounded bg-[#0d1117] border border-white/[0.04]">
              {data.surface}
            </span>
            {data.engine && (
              <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/50">
                ⚡ {data.engine}
              </span>
            )}
          </div>

          <h2 className="text-base font-bold text-slate-100 leading-snug">
            {data.label}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1a2230] transition active:scale-95 cursor-pointer flex-shrink-0 ml-3"
          title="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
        {/* 1. What Is The Finding / Overview Card */}
        {data.what_is_the_bug && (
          <div className="p-4 rounded-xl bg-[#171f2d] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Bug className="w-3.5 h-3.5" />
              <span>What Was Detected</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {data.what_is_the_bug}
            </p>
          </div>
        )}

        {/* 2. Why This Is A Bug & Threat Analysis */}
        {data.why_it_is_a_bug && (
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isVulnSection
                ? "bg-rose-950/20 border-rose-500/30"
                : isNews
                ? "bg-purple-950/20 border-purple-500/30"
                : isClean
                ? "bg-emerald-950/20 border-emerald-500/30"
                : "bg-indigo-950/20 border-indigo-500/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                  isVulnSection
                    ? "text-rose-400"
                    : isNews
                    ? "text-purple-400"
                    : isClean
                    ? "text-emerald-400"
                    : "text-indigo-400"
                }`}
              >
                {isClean ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>
                  {isClean
                    ? "Perimeter Hardening Verification"
                    : "Threat Analysis: Why This Is a Risk"}
                </span>
              </div>
              {data.cvss_score && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                  {data.cvss_score}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              {data.why_it_is_a_bug}
            </p>

            {/* Attack Vector / Exploitation Path */}
            {data.attack_vector && (
              <div className="pt-2 border-t border-white/[0.06] space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Adversary Attack Vector
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono bg-[#0c1017] p-2.5 rounded-lg border border-white/[0.04]">
                  {data.attack_vector}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. Standards & Compliance Badges */}
        {(data.owasp_tag || data.cwe_id) && (
          <div className="p-3.5 rounded-xl bg-[#0f141c] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Standards & Industry Classification</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {data.owasp_tag && (
                <span className="text-xs font-mono text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2 py-1 rounded-md">
                  {data.owasp_tag}
                </span>
              )}
              {data.cwe_id && (
                <span className="text-xs font-mono text-slate-300 bg-slate-900 border border-white/[0.06] px-2 py-1 rounded-md">
                  {data.cwe_id}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 4. Verified Source Endpoint */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Target Endpoint / URL
            </span>
            <button
              onClick={() => handleCopy(data.metadata?.url || "", "url")}
              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === "url" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === "url" ? "Copied URL" : "Copy URL"}</span>
            </button>
          </div>
          <a
            href={data.metadata?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f141c] border border-white/[0.06] text-sky-400 hover:text-sky-300 hover:border-sky-500/40 transition group font-mono text-xs break-all"
          >
            <span>{data.metadata?.url}</span>
            <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0 text-slate-500 group-hover:text-sky-400" />
          </a>
        </div>

        {/* 5. Google / Search Engine Index Snippet */}
        {data.metadata?.snippet && (
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Extracted Search Engine Proof Context
            </span>
            <div className="p-3 rounded-xl bg-[#0f141c] border border-white/[0.06] text-slate-300 text-xs font-mono leading-relaxed">
              {data.metadata.snippet}
            </div>
          </div>
        )}

        {/* 6. Exact Dork Query Executed */}
        {data.metadata?.dork_used && data.metadata.dork_used !== "N/A" && (
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Exact Dork Operator Executed
            </span>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f141c] border border-white/[0.06] text-amber-300 font-mono text-xs">
              <span className="truncate mr-2">{data.metadata.dork_used}</span>
              <button
                onClick={() => handleCopy(data.metadata.dork_used, "dork")}
                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer flex-shrink-0"
                title="Copy Dork"
              >
                {copiedKey === "dork" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* 7. Actionable Remediation Playbook ("How to Fix") */}
        {(data.how_to_fix || data.remediation || data.remediation_steps) && (
          <div className="border-t border-white/[0.08] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Defensive Remediation Guide: How to Fix</span>
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    (data.how_to_fix || data.remediation || "") +
                      "\n\n" +
                      (data.remediation_steps || []).join("\n\n"),
                    "remediation"
                  )
                }
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition font-medium cursor-pointer"
              >
                {copiedKey === "remediation" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy All Steps
                  </>
                )}
              </button>
            </div>

            {/* Directive Summary */}
            {(data.how_to_fix || data.remediation) && (
              <div className="p-3.5 rounded-xl bg-[#0f141c] border border-emerald-500/20 text-slate-200 text-xs leading-relaxed whitespace-pre-line">
                {data.how_to_fix || data.remediation}
              </div>
            )}

            {/* Structured Step-by-Step Actions */}
            {data.remediation_steps && data.remediation_steps.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Step-by-Step Directives & Configurations
                </span>
                {data.remediation_steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#0c1017] border border-white/[0.06] text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed relative group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="flex-1">{step}</span>
                      <button
                        onClick={() => handleCopy(step, `step-${idx}`)}
                        className="opacity-60 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-400 transition cursor-pointer ml-2 flex-shrink-0"
                        title="Copy command"
                      >
                        {copiedKey === `step-${idx}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. AI Triage Layer Verification */}
        {data.triage_reason && (
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                Autonomous AI Triage Layer Verdict
              </p>
            </div>
            <p className="text-xs text-indigo-200 leading-relaxed">
              {data.triage_reason}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.06] bg-[#161c28] flex items-center justify-between text-xs text-slate-400">
        <span>
          Engine: <strong className="text-slate-200 font-mono">{data.engine || "google"}</strong>
        </span>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition font-medium cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
