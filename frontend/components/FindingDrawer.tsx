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
  Bug,
  Lock,
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
      class: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    };
  }
  if (isResource) {
    return {
      label: "OSINT Resource",
      class: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    };
  }
  if (isNews) {
    return {
      label: "Threat Intel Advisory",
      class: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    };
  }
  if (isYoutube) {
    return {
      label: "Researcher PoC",
      class: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    };
  }
  if (isMobile) {
    return {
      label: "Mobile Client Asset",
      class: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    };
  }
  if (isToken) {
    return {
      label: "Critical Token Leak",
      class: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    };
  }
  if (isDoc) {
    return {
      label: "Confidential Document",
      class: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
    };
  }

  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return {
        label: "Critical Severity",
        class: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
      };
    case "HIGH":
      return {
        label: "High Severity",
        class: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
      };
    case "MEDIUM":
      return {
        label: "Medium Severity",
        class: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
      };
    case "LOW":
      return {
        label: "Low Severity",
        class: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
      };
    default:
      return {
        label: "Info Severity",
        class: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
      };
  }
};

export const FindingDrawer: React.FC<FindingDrawerProps> = ({ node, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!node) return null;

  const { data } = node;
  const isClean = data.category === "VULN_STATUS_CLEAN";
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
    ? "VULNERABILITY PERIMETER"
    : isResource
    ? "OSINT RESEARCH RESOURCE"
    : "PERIMETER ASSET";
  const sectionStyle = isVulnSection
    ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
    : isResource
    ? "bg-slate-100 text-slate-800 border-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
    : "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800";

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-surface border-l border-border shadow-2xl z-50 flex flex-col transition-all duration-200 font-mono">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-start justify-between bg-surface-elevated">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeStyle.class}`}>
              {badgeStyle.label}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${sectionStyle}`}>
              {sectionName}
            </span>
            <span className="text-[10px] text-foreground-secondary px-2 py-0.5 rounded bg-surface border border-border">
              {data.surface}
            </span>
            {data.engine && (
              <span className="text-[9px] text-lime uppercase px-1.5 py-0.5 rounded bg-surface border border-border">
                {data.engine}
              </span>
            )}
          </div>

          <h2 className="text-sm font-bold text-foreground leading-snug">
            {data.label}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded text-foreground-secondary hover:text-foreground hover:bg-surface-elevated transition active:scale-95 cursor-pointer ml-3"
          title="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {/* 1. What Was Detected */}
        {data.what_is_the_bug && (
          <div className="p-4 rounded bg-surface-elevated border border-border space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground-secondary uppercase tracking-wider">
              <Bug className="w-3.5 h-3.5" />
              <span>What Was Detected</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed font-sans">
              {data.what_is_the_bug}
            </p>
          </div>
        )}

        {/* 2. Threat Analysis */}
        {data.why_it_is_a_bug && (
          <div
            className={`p-4 rounded-lg border space-y-3 ${
              isVulnSection
                ? "bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/80"
                : isClean
                ? "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/80"
                : "bg-surface-elevated border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                {isClean ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                )}
                <span>
                  {isClean
                    ? "Perimeter Verification"
                    : "Threat Analysis & Risk"}
                </span>
              </div>
              {data.cvss_score && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                  CVSS {data.cvss_score}
                </span>
              )}
            </div>

            <p className="text-xs text-foreground-secondary leading-relaxed font-sans">
              {data.why_it_is_a_bug}
            </p>

            {/* Attack Vector */}
            {data.attack_vector && (
              <div className="pt-2 border-t border-border space-y-1">
                <span className="text-[10px] font-bold text-foreground-secondary uppercase tracking-wider block">
                  Adversary Attack Vector
                </span>
                <div className="text-[11px] text-foreground whitespace-pre-line leading-relaxed font-mono bg-background p-2.5 rounded border border-border">
                  {data.attack_vector}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Standards Badges */}
        {(data.owasp_tag || data.cwe_id) && (
          <div className="p-3.5 rounded-lg bg-surface-elevated border border-border space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground-secondary uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              <span>Security Standard Classification</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {data.owasp_tag && (
                <span className="text-[11px] font-mono text-emerald-700 dark:text-lime bg-background border border-border px-2 py-0.5 rounded">
                  {data.owasp_tag}
                </span>
              )}
              {data.cwe_id && (
                <span className="text-[11px] font-mono text-foreground bg-background border border-border px-2 py-0.5 rounded">
                  {data.cwe_id}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 4. Target Endpoint */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-foreground-secondary uppercase tracking-wider">
              Target Endpoint / URL
            </span>
            <button
              onClick={() => handleCopy(data.metadata?.url || "", "url")}
              className="text-[10px] text-foreground-secondary hover:text-foreground flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === "url" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === "url" ? "Copied" : "Copy URL"}</span>
            </button>
          </div>
          <a
            href={data.metadata?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated border border-border text-emerald-700 dark:text-lime hover:border-border-strong transition group font-mono text-xs break-all"
          >
            <span>{data.metadata?.url}</span>
            <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0 text-foreground-muted group-hover:text-foreground" />
          </a>
        </div>

        {/* 5. Search Engine Proof Context */}
        {data.metadata?.snippet && (
          <div>
            <span className="text-[10px] font-semibold text-foreground-secondary uppercase tracking-wider block mb-1.5">
              Proof Context
            </span>
            <div className="p-3 rounded-lg bg-surface-elevated border border-border text-foreground-secondary text-xs leading-relaxed font-sans">
              {data.metadata.snippet}
            </div>
          </div>
        )}

        {/* 6. Exact Dork Query */}
        {data.metadata?.dork_used && data.metadata.dork_used !== "N/A" && (
          <div>
            <span className="text-[10px] font-semibold text-foreground-secondary uppercase tracking-wider block mb-1.5">
              Exact Dork Operator Executed
            </span>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated border border-border text-emerald-700 dark:text-lime font-mono text-xs">
              <span className="truncate mr-2">{data.metadata.dork_used}</span>
              <button
                onClick={() => handleCopy(data.metadata.dork_used, "dork")}
                className="p-1 text-foreground-secondary hover:text-foreground cursor-pointer flex-shrink-0"
              >
                {copiedKey === "dork" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* 7. Actionable Remediation Guide */}
        {(data.how_to_fix || data.remediation || data.remediation_steps) && (
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono">
                <Terminal className="w-3.5 h-3.5" />
                <span>Defensive Remediation Guide</span>
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
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition cursor-pointer"
              >
                {copiedKey === "remediation" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy All Steps
                  </>
                )}
              </button>
            </div>

            {/* Directive */}
            {(data.how_to_fix || data.remediation) && (
              <div className="p-3 rounded bg-surface-elevated border border-border text-foreground-secondary text-xs leading-relaxed font-sans">
                {data.how_to_fix || data.remediation}
              </div>
            )}

            {/* Steps */}
            {data.remediation_steps && data.remediation_steps.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-foreground-secondary uppercase tracking-wider block">
                  Action Directives & Configurations
                </span>
                {data.remediation_steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded bg-background border border-border text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed relative group flex items-start justify-between"
                  >
                    <span className="flex-1">{step}</span>
                    <button
                      onClick={() => handleCopy(step, `step-${idx}`)}
                      className="opacity-60 group-hover:opacity-100 p-1 text-foreground-secondary hover:text-emerald-500 cursor-pointer ml-2 flex-shrink-0"
                    >
                      {copiedKey === `step-${idx}` ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. AI Triage */}
        {data.triage_reason && (
          <div className="p-3.5 rounded bg-surface-elevated border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-foreground-secondary">
              <Sparkles className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Autonomous AI Triage Layer Verdict
              </p>
            </div>
            <p className="text-xs text-foreground-secondary leading-relaxed font-sans">
              {data.triage_reason}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-surface-elevated flex items-center justify-between text-xs text-foreground-secondary">
        <span>
          Engine: <strong className="text-foreground">{data.engine || "google"}</strong>
        </span>
        <button
          onClick={onClose}
          className="px-3.5 py-1.5 rounded bg-surface text-foreground border border-border hover:bg-surface-elevated transition cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

