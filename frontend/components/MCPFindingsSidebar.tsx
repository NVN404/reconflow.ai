"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Target,
  Radar,
  TrendingDown,
} from "lucide-react";
import { ScanSummary } from "@/lib/types";

interface MCPFindingsSidebarProps {
  summary: ScanSummary | null;
  onAskAbout?: (question: string) => void;
}

export const MCPFindingsSidebar: React.FC<MCPFindingsSidebarProps> = ({
  summary,
  onAskAbout,
}) => {
  if (!summary || summary.total_nodes === 0) {
    return (
      <div className="h-[640px] rounded-xl border border-border bg-surface shadow-lg overflow-hidden font-mono flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-foreground-muted" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Findings Overview</span>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border flex items-center justify-center mb-3">
            <Target className="w-6 h-6 text-foreground-muted" />
          </div>
          <p className="text-xs font-bold text-foreground mb-1">No Scan Data</p>
          <p className="text-[11px] text-foreground-secondary">
            Execute an MCP scan to populate the findings dashboard.
          </p>
        </div>
      </div>
    );
  }

  const totalVulns = summary.critical_risks + summary.high_risks + summary.medium_risks;

  const getScoreColor = () => {
    if (summary.security_score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (summary.security_score >= 60) return "text-lime";
    if (summary.security_score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getGradeColor = () => {
    switch (summary.security_grade) {
      case "A": return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
      case "B": return "bg-lime/15 text-lime border-lime/30";
      case "C": return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
      case "D": return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
      default: return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800";
    }
  };

  const getScoreRingPercent = () => {
    return Math.min(100, Math.max(0, summary.security_score));
  };

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (getScoreRingPercent() / 100) * circumference;

  const severityItems = [
    {
      label: "Critical",
      count: summary.critical_risks,
      icon: <ShieldAlert className="w-4 h-4" />,
      accentBorder: "border-l-rose-500",
      textColor: "text-rose-700 dark:text-rose-300",
      bgColor: "bg-rose-500/5 dark:bg-rose-950/30",
      borderColor: "border-rose-500/20 dark:border-rose-800/50",
      question: "Explain all critical severity findings and their immediate risk",
    },
    {
      label: "High",
      count: summary.high_risks,
      icon: <AlertTriangle className="w-4 h-4" />,
      accentBorder: "border-l-orange-500",
      textColor: "text-orange-700 dark:text-orange-300",
      bgColor: "bg-orange-500/5 dark:bg-orange-950/30",
      borderColor: "border-orange-500/20 dark:border-orange-800/50",
      question: "What are the high severity findings and how can I remediate them?",
    },
    {
      label: "Medium",
      count: summary.medium_risks,
      icon: <AlertCircle className="w-4 h-4" />,
      accentBorder: "border-l-amber-500",
      textColor: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-500/5 dark:bg-amber-950/30",
      borderColor: "border-amber-500/20 dark:border-amber-800/50",
      question: "Detail the medium severity findings and their potential impact",
    },
    {
      label: "Low",
      count: summary.low_risks,
      icon: <Info className="w-4 h-4" />,
      accentBorder: "border-l-slate-400 dark:border-l-zinc-500",
      textColor: "text-slate-700 dark:text-zinc-300",
      bgColor: "bg-slate-500/5 dark:bg-zinc-800/30",
      borderColor: "border-slate-300 dark:border-zinc-700/50",
      question: "List all low severity and informational findings",
    },
    {
      label: "Info Assets",
      count: summary.info,
      icon: <ShieldCheck className="w-4 h-4" />,
      accentBorder: "border-l-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-emerald-500/5 dark:bg-emerald-950/30",
      borderColor: "border-emerald-500/20 dark:border-emerald-800/50",
      question: "Summarize all info-level assets and clean perimeters found",
    },
  ];

  return (
    <div className="h-[640px] rounded-xl border border-border bg-surface shadow-lg overflow-hidden font-mono flex flex-col transition-all duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface-elevated flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-lime" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Findings Overview</span>
        </div>
        {summary.protocol_used && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold uppercase">
            {summary.protocol_used}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Security Score Ring */}
        <div className="flex flex-col items-center p-4 rounded-xl bg-surface-elevated border border-border shadow-sm">
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-3">Security Score</span>
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="6"
                className="stroke-border"
              />
              {/* Score Ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                className={`${
                  summary.security_score >= 80 ? "stroke-emerald-500" :
                  summary.security_score >= 60 ? "stroke-lime" :
                  summary.security_score >= 40 ? "stroke-amber-500" :
                  "stroke-rose-500"
                } transition-all duration-1000 ease-out`}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
            </svg>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black ${getScoreColor()}`}>
                {summary.security_score}
              </span>
              <span className="text-[9px] text-foreground-muted">/100</span>
            </div>
          </div>
          {/* Grade Badge */}
          <div className={`mt-3 px-3 py-1 rounded-lg text-xs font-black border ${getGradeColor()}`}>
            Grade {summary.security_grade}
          </div>
        </div>

        {/* Vulnerability Total */}
        <div className="p-3 rounded-lg bg-background border border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-foreground-muted" />
            <span className="text-[11px] text-foreground-secondary">Total Vulnerabilities</span>
          </div>
          <span className={`text-sm font-black ${totalVulns > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {totalVulns}
          </span>
        </div>

        {/* Severity Breakdown Cards */}
        <div className="space-y-2">
          {severityItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onAskAbout?.(item.question)}
              className={`w-full p-3 rounded-lg ${item.bgColor} border ${item.borderColor} border-l-[3px] ${item.accentBorder} flex items-center justify-between hover:shadow-sm transition-all cursor-pointer group text-left`}
            >
              <div className="flex items-center gap-2.5">
                <span className={item.textColor}>{item.icon}</span>
                <span className="text-xs font-bold text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black ${item.textColor}`}>
                  {item.count}
                </span>
                <span className="text-[9px] text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  Ask AI →
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Target & Meta */}
        <div className="p-3 rounded-lg bg-surface-elevated border border-border space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">Target</span>
            <span className="font-bold text-foreground">{summary.target}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">Total Nodes</span>
            <span className="font-bold text-foreground">{summary.total_nodes}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">SerpApi Credits</span>
            <span className="font-bold text-lime">{summary.serpapi_credits_used}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">Generated</span>
            <span className="font-bold text-foreground text-[10px]">
              {new Date(summary.generated_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
