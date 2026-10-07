import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Cpu, Radar } from "lucide-react";
import { ScanSummary } from "@/lib/types";

interface SummaryCardsProps {
  summary: ScanSummary;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  activeFilter,
  onFilterChange,
}) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-emerald-500/15 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-800/80";
      case "B":
        return "bg-surface-elevated text-foreground border border-border";
      case "C":
        return "bg-lime/10 text-lime border border-lime/30";
      case "D":
        return "bg-orange-500/15 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-500/30 dark:border-orange-800";
      default:
        return "bg-rose-500/15 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-500/30 dark:border-rose-800";
    }
  };

  // Compute aggregated vulnerability metrics and highest severity state
  const totalVulns = summary.critical_risks + summary.high_risks + summary.medium_risks;

  let highestSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "CLEAN" = "CLEAN";
  if (summary.critical_risks > 0) {
    highestSeverity = "CRITICAL";
  } else if (summary.high_risks > 0) {
    highestSeverity = "HIGH";
  } else if (summary.medium_risks > 0) {
    highestSeverity = "MEDIUM";
  }

  const isVulnFilterActive =
    activeFilter === "VULNERABILITIES" ||
    activeFilter === "CRITICAL" ||
    activeFilter === "HIGH" ||
    activeFilter === "MEDIUM";

  return (
    <div className="space-y-3 font-mono">
      {/* Streamlined 4-Column Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Security Posture Grade */}
        <div className="p-4 rounded-lg bg-surface border border-border flex items-center justify-between shadow-sm transition-colors duration-200">
          <div>
            <p className="text-[11px] font-medium text-foreground-secondary uppercase tracking-wider">
              Posture Grade
            </p>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-bold text-foreground">
                {summary.security_score}
              </span>
              <span className="text-xs text-foreground-muted">/100</span>
            </div>
            <p className="text-[10px] text-foreground-muted mt-1 truncate">
              {summary.security_score >= 80
                ? "Low Risk Surface"
                : summary.security_score >= 60
                ? "Moderate Exposure"
                : "Critical Attention"}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shadow-inner ${getGradeColor(
              summary.security_grade
            )}`}
          >
            {summary.security_grade}
          </div>
        </div>

        {/* Card 2: Unified Dynamic Vulnerabilities Box */}
        <button
          onClick={() => onFilterChange(isVulnFilterActive ? "ALL" : "VULNERABILITIES")}
          className={`p-4 rounded-lg text-left transition-all shadow-sm cursor-pointer border ${
            isVulnFilterActive
              ? highestSeverity === "CRITICAL"
                ? "bg-rose-500/20 dark:bg-rose-950/80 border-rose-500 dark:border-rose-600 ring-1 ring-rose-500/50"
                : highestSeverity === "HIGH"
                ? "bg-orange-500/20 dark:bg-orange-950/80 border-orange-500 dark:border-orange-600 ring-1 ring-orange-500/50"
                : highestSeverity === "MEDIUM"
                ? "bg-amber-500/20 dark:bg-amber-950/80 border-amber-500 dark:border-amber-600 ring-1 ring-amber-500/50"
                : "bg-emerald-500/20 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 ring-1 ring-emerald-500/40"
              : highestSeverity === "CRITICAL"
              ? "bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/40 dark:border-rose-800/80 hover:border-rose-500"
              : highestSeverity === "HIGH"
              ? "bg-orange-500/10 dark:bg-orange-950/40 border-orange-500/40 dark:border-orange-800/80 hover:border-orange-500"
              : highestSeverity === "MEDIUM"
              ? "bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/40 dark:border-amber-800/60 hover:border-amber-500"
              : "bg-surface border-border hover:border-emerald-500/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <p
                className={`text-[11px] font-medium uppercase tracking-wider ${
                  highestSeverity === "CRITICAL"
                    ? "text-rose-600 dark:text-rose-400"
                    : highestSeverity === "HIGH"
                    ? "text-orange-600 dark:text-orange-400"
                    : highestSeverity === "MEDIUM"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground-secondary"
                }`}
              >
                Vulnerabilities
              </p>
              {highestSeverity === "CRITICAL" && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-500/40 dark:border-rose-700/80 font-bold uppercase">
                  Critical
                </span>
              )}
              {highestSeverity === "HIGH" && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-500/40 dark:border-orange-700/80 font-bold uppercase">
                  High Risk
                </span>
              )}
              {highestSeverity === "MEDIUM" && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-500/40 dark:border-amber-700/80 font-bold uppercase">
                  Medium
                </span>
              )}
              {highestSeverity === "CLEAN" && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 dark:border-emerald-800/60 font-bold uppercase">
                  Clean
                </span>
              )}
            </div>

            {highestSeverity === "CRITICAL" ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            ) : highestSeverity === "HIGH" ? (
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            ) : highestSeverity === "MEDIUM" ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            )}
          </div>

          <div className="flex items-baseline gap-1 mt-1.5">
            <span
              className={`text-2xl font-bold ${
                highestSeverity === "CRITICAL"
                  ? "text-rose-600 dark:text-rose-400"
                  : highestSeverity === "HIGH"
                  ? "text-orange-600 dark:text-orange-400"
                  : highestSeverity === "MEDIUM"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-500"
              }`}
            >
              {totalVulns}
            </span>
          </div>

          <p
            className={`text-[10px] mt-1 truncate ${
              highestSeverity === "CRITICAL"
                ? "text-rose-700/80 dark:text-rose-300/80"
                : highestSeverity === "HIGH"
                ? "text-orange-700/80 dark:text-orange-300/80"
                : highestSeverity === "MEDIUM"
                ? "text-amber-700/80 dark:text-amber-300/80"
                : "text-emerald-700/80 dark:text-emerald-500/80"
            }`}
          >
            {highestSeverity === "CRITICAL"
              ? `${summary.critical_risks} Critical${
                  summary.high_risks > 0 ? ` • ${summary.high_risks} High` : ""
                }${summary.medium_risks > 0 ? ` • ${summary.medium_risks} Med` : ""}`
              : highestSeverity === "HIGH"
              ? `${summary.high_risks} High Risk${
                  summary.medium_risks > 0 ? ` • ${summary.medium_risks} Med` : ""
                }`
              : highestSeverity === "MEDIUM"
              ? `${summary.medium_risks} Medium Exposure${
                  summary.medium_risks > 1 ? "s" : ""
                }`
              : "Zero Exploits Detected"}
          </p>
        </button>

        {/* Card 3: Discovered Subdomains & Perimeter Assets */}
        <button
          onClick={() => onFilterChange(activeFilter === "ASSETS" ? "ALL" : "ASSETS")}
          className={`p-4 rounded-lg text-left transition-all shadow-sm cursor-pointer border ${
            activeFilter === "ASSETS" || activeFilter === "LOW"
              ? "bg-surface-elevated border-lime ring-1 ring-lime/40"
              : "bg-surface border-border hover:border-border-strong"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-foreground-secondary uppercase tracking-wider">
              Subdomains
            </p>
            <Cpu className="w-4 h-4 text-foreground-secondary" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-1.5">
            {summary.low_risks}
          </p>
          <p className="text-[10px] text-foreground-muted mt-1 truncate">
            Discovered Perimeter Assets
          </p>
        </button>

        {/* Card 4: Threat Radar (Phase 2 External Intel & Leaks) */}
        <button
          onClick={() => onFilterChange(activeFilter === "RADAR" ? "ALL" : "RADAR")}
          className={`p-4 rounded-lg text-left transition-all shadow-sm cursor-pointer border ${
            activeFilter === "RADAR" || activeFilter === "THREAT_RADAR"
              ? "bg-purple-500/20 dark:bg-purple-950/80 border-purple-500 dark:border-purple-600 ring-1 ring-purple-500/50"
              : (summary.external_threat_count || 0) > 0
              ? "bg-purple-500/10 dark:bg-[#140b24]/90 border-purple-500/30 dark:border-purple-800/80 hover:border-purple-500"
              : "bg-surface border-border hover:border-border-strong"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-[11px] font-medium uppercase tracking-wider ${
                (summary.external_threat_count || 0) > 0 ? "text-purple-700 dark:text-purple-300" : "text-foreground-secondary"
              }`}
            >
              Threat Radar
            </p>
            <Radar
              className={`w-4 h-4 ${
                (summary.external_threat_count || 0) > 0 ? "text-purple-600 dark:text-purple-400" : "text-foreground-muted"
              }`}
            />
          </div>
          <p
            className={`text-2xl font-bold mt-1.5 ${
              (summary.external_threat_count || 0) > 0 ? "text-purple-700 dark:text-purple-200" : "text-foreground"
            }`}
          >
            {summary.external_threat_count || 0}
          </p>
          <p className="text-[10px] text-foreground-muted mt-1 truncate">
            External Buckets &amp; Leaks
          </p>
        </button>
      </div>
    </div>
  );
};
