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
        return "bg-[#0f2e22] text-[#4ade9b]";
      case "B":
        return "bg-[#10253d] text-[#6fb2f5]";
      case "C":
        return "bg-[#3a2b0a] text-[#ffc26b]";
      case "D":
        return "bg-[#3a2013] text-[#ff9d6b]";
      default:
        return "bg-[#3a1418] text-[#ff6b6a]";
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Security Health Grade */}
        <div className="p-4 rounded-xl bg-[#141a24] border-0 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Health Grade
            </p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-[26px] font-medium text-slate-100">
                {summary.security_score}
              </span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${getGradeColor(
              summary.security_grade
            )}`}
          >
            {summary.security_grade}
          </div>
        </div>

        {/* Critical Exposures (RED ONLY IF > 0) */}
        <button
          onClick={() => onFilterChange(activeFilter === "CRITICAL" ? "ALL" : "CRITICAL")}
          className={`p-4 rounded-xl text-left transition-all duration-150 shadow-sm cursor-pointer active:scale-95 border-0 ${
            activeFilter === "CRITICAL"
              ? summary.critical_risks > 0
                ? "bg-[#3a1418] ring-2 ring-[#ff6b6a]/40"
                : "bg-slate-800/60 ring-2 ring-slate-600/40"
              : summary.critical_risks > 0
              ? "bg-[#3a1418]/60 hover:bg-[#3a1418] ring-1 ring-[#ff6b6a]/40"
              : "bg-[#141a24] hover:bg-[#1a2230]"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-medium ${
              summary.critical_risks > 0 ? "text-[#ff6b6a]" : "text-slate-400"
            }`}>
              Critical
            </p>
            {summary.critical_risks > 0 ? (
              <ShieldAlert className="w-4 h-4 text-[#ff6b6a]" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#4ade9b]" />
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-[26px] font-medium ${
              summary.critical_risks > 0 ? "text-[#ff6b6a]" : "text-[#4ade9b]"
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
          className={`p-4 rounded-xl text-left transition-all duration-150 shadow-sm cursor-pointer active:scale-95 border-0 ${
            activeFilter === "HIGH"
              ? "bg-[#3a2013] ring-2 ring-[#ff9d6b]/40"
              : summary.high_risks > 0
              ? "bg-[#3a2013]/60 hover:bg-[#3a2013] ring-1 ring-[#ff9d6b]/40"
              : "bg-[#141a24] hover:bg-[#1a2230]"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-medium ${
              summary.high_risks > 0 ? "text-[#ff9d6b]" : "text-slate-400"
            }`}>
              High Risk
            </p>
            <AlertTriangle className={`w-4 h-4 ${summary.high_risks > 0 ? "text-[#ff9d6b]" : "text-slate-500"}`} />
          </div>
          <p className={`text-[26px] font-medium mt-2 ${summary.high_risks > 0 ? "text-[#ff9d6b]" : "text-slate-300"}`}>
            {summary.high_risks}
          </p>
        </button>

        {/* Medium Exposures */}
        <button
          onClick={() => onFilterChange(activeFilter === "MEDIUM" ? "ALL" : "MEDIUM")}
          className={`p-4 rounded-xl text-left transition-all duration-150 shadow-sm cursor-pointer active:scale-95 border-0 ${
            activeFilter === "MEDIUM"
              ? "bg-[#3a2b0a] ring-2 ring-[#ffc26b]/40"
              : summary.medium_risks > 0
              ? "bg-[#3a2b0a]/60 hover:bg-[#3a2b0a] ring-1 ring-[#ffc26b]/40"
              : "bg-[#141a24] hover:bg-[#1a2230]"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-medium ${
              summary.medium_risks > 0 ? "text-[#ffc26b]" : "text-slate-400"
            }`}>
              Medium
            </p>
            <AlertTriangle className={`w-4 h-4 ${summary.medium_risks > 0 ? "text-[#ffc26b]" : "text-slate-500"}`} />
          </div>
          <p className={`text-[26px] font-medium mt-2 ${summary.medium_risks > 0 ? "text-[#ffc26b]" : "text-slate-300"}`}>
            {summary.medium_risks}
          </p>
        </button>

        {/* Subdomains / Infrastructure */}
        <button
          onClick={() => onFilterChange(activeFilter === "LOW" ? "ALL" : "LOW")}
          className={`p-4 rounded-xl text-left transition-all duration-150 shadow-sm cursor-pointer active:scale-95 border-0 ${
            activeFilter === "LOW"
              ? "bg-[#10253d] ring-2 ring-[#6fb2f5]/40"
              : "bg-[#141a24] hover:bg-[#1a2230]"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#6fb2f5]">
              Subdomains
            </p>
            <Cpu className="w-4 h-4 text-[#6fb2f5]" />
          </div>
          <p className="text-[26px] font-medium text-slate-100 mt-2">
            {summary.low_risks}
          </p>
        </button>

        {/* SerpApi Credits Used */}
        <div className="p-4 rounded-xl bg-[#141a24] border-0 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-[#6fb2f5]">
              SerpApi Credits
            </p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-[26px] font-medium text-[#6fb2f5]">
                {summary.serpapi_credits_used}
              </span>
              <span className="text-xs text-slate-400">queries</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-[#10253d] text-[#6fb2f5]">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
