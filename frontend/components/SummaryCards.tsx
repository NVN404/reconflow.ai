import React from "react";
import { ShieldAlert, AlertTriangle, ShieldCheck, Cpu, Zap, Filter } from "lucide-react";
import { ScanSummary, SeverityLevel } from "@/lib/types";

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
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "B":
        return "text-sky-400 border-sky-500/30 bg-sky-500/10";
      case "C":
        return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "D":
        return "text-orange-400 border-orange-500/30 bg-orange-500/10";
      default:
        return "text-red-400 border-red-500/30 bg-red-500/10";
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Security Health Grade */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Health Grade
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-100">
                {summary.security_score}
              </span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-lg ${getGradeColor(
              summary.security_grade
            )}`}
          >
            {summary.security_grade}
          </div>
        </div>

        {/* Critical Exposures (RED ONLY IF > 0) */}
        <button
          onClick={() => onFilterChange(activeFilter === "CRITICAL" ? "ALL" : "CRITICAL")}
          className={`p-3.5 rounded-xl text-left transition-all backdrop-blur-md border shadow-lg ${
            activeFilter === "CRITICAL"
              ? summary.critical_risks > 0
                ? "bg-red-500/20 border-red-500/80 ring-2 ring-red-500/40"
                : "bg-slate-800/60 border-slate-700 ring-2 ring-slate-600/40"
              : summary.critical_risks > 0
              ? "bg-red-950/20 border-red-500/40 hover:border-red-400 animate-pulse-slow"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${
              summary.critical_risks > 0 ? "text-red-400" : "text-slate-400"
            }`}>
              Critical
            </p>
            {summary.critical_risks > 0 ? (
              <ShieldAlert className="w-4 h-4 text-red-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-2xl font-black ${
              summary.critical_risks > 0 ? "text-red-400" : "text-emerald-400"
            }`}>
              {summary.critical_risks}
            </span>
            {summary.critical_risks === 0 && (
              <span className="text-[10px] font-mono text-emerald-500/80">Clean</span>
            )}
          </div>
        </button>

        {/* High Risks */}
        <button
          onClick={() => onFilterChange(activeFilter === "HIGH" ? "ALL" : "HIGH")}
          className={`p-3.5 rounded-xl text-left transition-all backdrop-blur-md border shadow-lg ${
            activeFilter === "HIGH"
              ? "bg-orange-500/20 border-orange-500/80 ring-2 ring-orange-500/40"
              : summary.high_risks > 0
              ? "bg-orange-950/20 border-orange-500/40 hover:border-orange-400"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${
              summary.high_risks > 0 ? "text-orange-400" : "text-slate-400"
            }`}>
              High Risk
            </p>
            <AlertTriangle className={`w-4 h-4 ${summary.high_risks > 0 ? "text-orange-400" : "text-slate-500"}`} />
          </div>
          <p className={`text-2xl font-black mt-0.5 ${summary.high_risks > 0 ? "text-orange-400" : "text-slate-300"}`}>
            {summary.high_risks}
          </p>
        </button>

        {/* Medium Exposures */}
        <button
          onClick={() => onFilterChange(activeFilter === "MEDIUM" ? "ALL" : "MEDIUM")}
          className={`p-3.5 rounded-xl text-left transition-all backdrop-blur-md border shadow-lg ${
            activeFilter === "MEDIUM"
              ? "bg-amber-500/20 border-amber-500/80 ring-2 ring-amber-500/40"
              : summary.medium_risks > 0
              ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-400"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${
              summary.medium_risks > 0 ? "text-amber-400" : "text-slate-400"
            }`}>
              Medium
            </p>
            <AlertTriangle className={`w-4 h-4 ${summary.medium_risks > 0 ? "text-amber-400" : "text-slate-500"}`} />
          </div>
          <p className={`text-2xl font-black mt-0.5 ${summary.medium_risks > 0 ? "text-amber-400" : "text-slate-300"}`}>
            {summary.medium_risks}
          </p>
        </button>

        {/* Subdomains / Infrastructure */}
        <button
          onClick={() => onFilterChange(activeFilter === "LOW" ? "ALL" : "LOW")}
          className={`p-3.5 rounded-xl text-left transition-all backdrop-blur-md border shadow-lg ${
            activeFilter === "LOW"
              ? "bg-sky-500/20 border-sky-500/80 ring-2 ring-sky-500/40"
              : "bg-slate-900/80 border-slate-800 hover:border-sky-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">
              Subdomains
            </p>
            <Cpu className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-slate-100 mt-0.5">
            {summary.low_risks}
          </p>
        </button>

        {/* SerpApi Credits Used */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">
              SerpApi Credits
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-sky-400">
                {summary.serpapi_credits_used}
              </span>
              <span className="text-xs text-slate-500 font-mono">queries</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
