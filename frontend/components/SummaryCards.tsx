import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Cpu, Zap } from "lucide-react";
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
        return "bg-emerald-950 text-emerald-400 border border-emerald-800/80";
      case "B":
        return "bg-zinc-800 text-zinc-100 border border-zinc-700";
      case "C":
        return "bg-[#B7E36A]/10 text-[#B7E36A] border border-[#B7E36A]/30";
      case "D":
        return "bg-orange-950 text-orange-400 border border-orange-800";
      default:
        return "bg-rose-950 text-rose-400 border border-rose-800";
    }
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Security Health Score */}
        <div className="p-4 rounded-lg bg-[#0B0B0B] border border-[#292929] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Posture Grade
            </p>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-bold text-zinc-100">
                {summary.security_score}
              </span>
              <span className="text-xs text-zinc-500">/100</span>
            </div>
          </div>
          <div
            className={`w-9 h-9 rounded flex items-center justify-center font-bold text-sm ${getGradeColor(
              summary.security_grade
            )}`}
          >
            {summary.security_grade}
          </div>
        </div>

        {/* Critical Exposures */}
        <button
          onClick={() => onFilterChange(activeFilter === "CRITICAL" ? "ALL" : "CRITICAL")}
          className={`p-4 rounded-lg text-left transition-all shadow-sm cursor-pointer border ${
            activeFilter === "CRITICAL"
              ? "bg-rose-950/80 border-rose-600 ring-1 ring-rose-500/50"
              : summary.critical_risks > 0
              ? "bg-rose-950/50 border-rose-800/80 hover:border-rose-600"
              : "bg-[#0B0B0B] border-[#292929] hover:border-[#383838]"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-medium uppercase tracking-wider ${
              summary.critical_risks > 0 ? "text-rose-400" : "text-zinc-400"
            }`}>
              Critical
            </p>
            {summary.critical_risks > 0 ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className={`text-2xl font-bold ${
              summary.critical_risks > 0 ? "text-rose-400" : "text-emerald-500"
            }`}>
              {summary.critical_risks}
            </span>
            {summary.critical_risks === 0 && (
              <span className="text-[10px] text-emerald-500 font-semibold">Clean</span>
            )}
          </div>
        </button>

        {/* High Risk */}
        <button
          onClick={() => onFilterChange(activeFilter === "HIGH" ? "ALL" : "HIGH")}
          className={`p-4 rounded-lg text-left transition-all shadow-sm cursor-pointer border ${
            activeFilter === "HIGH"
              ? "bg-orange-950/80 border-orange-600 ring-1 ring-orange-500/50"
              : summary.high_risks > 0
              ? "bg-orange-950/50 border-orange-800/80 hover:border-orange-600"
              : "bg-[#0B0B0B] border-[#292929] hover:border-[#383838]"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-medium uppercase tracking-wider ${
              summary.high_risks > 0 ? "text-orange-400" : "text-zinc-400"
            }`}>
              High Risk
            </p>
            <AlertTriangle className={`w-4 h-4 ${summary.high_risks > 0 ? "text-orange-400" : "text-zinc-500"}`} />
          </div>
          <p className={`text-2xl font-bold mt-1.5 ${summary.high_risks > 0 ? "text-orange-400" : "text-zinc-100"}`}>
            {summary.high_risks}
          </p>
        </button>

        {/* Medium Exposures */}
        <button
          onClick={() => onFilterChange(activeFilter === "MEDIUM" ? "ALL" : "MEDIUM")}
          className={`p-4 rounded-lg text-left transition-all shadow-sm cursor-pointer border ${
            activeFilter === "MEDIUM"
              ? "bg-[#111111] border-[#383838] ring-1 ring-[#B7E36A]/40"
              : "bg-[#0B0B0B] border-[#292929] hover:border-[#383838]"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Medium
            </p>
            <AlertTriangle className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-100 mt-1.5">
            {summary.medium_risks}
          </p>
        </button>

        {/* Subdomains / Assets */}
        <button
          onClick={() => onFilterChange(activeFilter === "LOW" ? "ALL" : "LOW")}
          className={`p-4 rounded-lg text-left transition-all shadow-sm cursor-pointer border ${
            activeFilter === "LOW"
              ? "bg-[#111111] border-[#B7E36A]/60"
              : "bg-[#0B0B0B] border-[#292929] hover:border-[#383838]"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Subdomains
            </p>
            <Cpu className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-100 mt-1.5">
            {summary.low_risks}
          </p>
        </button>

        {/* SerpApi Credits */}
        <div className="p-4 rounded-lg bg-[#0B0B0B] border border-[#292929] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              SerpApi Credits
            </p>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-bold text-zinc-100">
                {summary.serpapi_credits_used}
              </span>
              <span className="text-[10px] text-zinc-500">reqs</span>
            </div>
          </div>
          <div className="p-2 rounded bg-[#111111] text-zinc-400 border border-zinc-800">
            <Zap className="w-4 h-4 text-[#B7E36A]" />
          </div>
        </div>
      </div>
    </div>
  );
};
