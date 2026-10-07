import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { FileCode2, ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { NodeData } from "@/lib/types";

interface FindingNodeProps {
  data: NodeData & { layoutDirection?: "TB" | "LR" };
  selected?: boolean;
}

const getSeverityStyles = (severity: string, isClean = false) => {
  if (isClean) {
    return {
      label: "SECURE",
      card: "bg-white dark:bg-[#0c0c0c] border-2 border-emerald-500/80 hover:border-emerald-500 shadow-md",
      badge: "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700",
      iconBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800",
      handle: "!bg-emerald-500",
      selectedBorder: "bg-white dark:bg-[#0c0c0c] border-2 border-emerald-500 ring-4 ring-emerald-500/30 shadow-xl",
    };
  }

  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return {
        label: "CRITICAL",
        card: "bg-white dark:bg-[#0c0c0c] border-2 border-rose-500 hover:border-rose-600 shadow-md",
        badge: "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-700",
        iconBg: "bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-300 dark:border-rose-800",
        handle: "!bg-rose-500",
        selectedBorder: "bg-white dark:bg-[#0c0c0c] border-2 border-rose-500 ring-4 ring-rose-500/30 shadow-xl",
      };
    case "HIGH":
      return {
        label: "HIGH",
        card: "bg-white dark:bg-[#0c0c0c] border-2 border-orange-500 hover:border-orange-600 shadow-md",
        badge: "bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/90 dark:text-orange-300 dark:border-orange-700",
        iconBg: "bg-orange-50 text-orange-700 dark:bg-orange-950/80 dark:text-orange-400 border border-orange-300 dark:border-orange-800",
        handle: "!bg-orange-500",
        selectedBorder: "bg-white dark:bg-[#0c0c0c] border-2 border-orange-500 ring-4 ring-orange-500/30 shadow-xl",
      };
    case "MEDIUM":
      return {
        label: "MEDIUM",
        card: "bg-white dark:bg-[#0c0c0c] border-2 border-amber-500 hover:border-amber-600 shadow-md",
        badge: "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/90 dark:text-amber-300 dark:border-amber-700",
        iconBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-300 dark:border-amber-800",
        handle: "!bg-amber-500",
        selectedBorder: "bg-white dark:bg-[#0c0c0c] border-2 border-amber-500 ring-4 ring-amber-500/30 shadow-xl",
      };
    case "LOW":
      return {
        label: "LOW",
        card: "bg-white dark:bg-[#0c0c0c] border-2 border-slate-300 dark:border-zinc-700 hover:border-slate-400 shadow-md",
        badge: "bg-slate-100 text-slate-800 border border-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
        iconBg: "bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700",
        handle: "!bg-slate-400 dark:!bg-zinc-500",
        selectedBorder: "bg-white dark:bg-[#0c0c0c] border-2 border-slate-600 ring-4 ring-slate-400/30 shadow-xl",
      };
    default:
      return {
        label: "INFO",
        card: "bg-white dark:bg-[#0c0c0c] border-2 border-slate-300 dark:border-zinc-700 hover:border-slate-400 shadow-md",
        badge: "bg-slate-100 text-slate-800 border border-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
        iconBg: "bg-slate-50 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700",
        handle: "!bg-slate-400 dark:!bg-zinc-500",
        selectedBorder: "bg-white dark:bg-[#0c0c0c] border-2 border-slate-600 ring-4 ring-slate-400/30 shadow-xl",
      };
  }
};

export const FindingNode = memo(({ data, selected }: FindingNodeProps) => {
  const isHorizontal = data.layoutDirection === "LR";
  const isCleanStatus = data.category === "VULN_STATUS_CLEAN";
  const isCritical = data.severity === "CRITICAL" && !isCleanStatus;
  const isHigh = data.severity === "HIGH" && !isCleanStatus;
  const styles = getSeverityStyles(data.severity, isCleanStatus);

  return (
    <div
      className={`relative w-[260px] p-4 rounded-xl transition-all duration-200 cursor-pointer ${
        selected ? styles.selectedBorder : styles.card
      }`}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className={`${styles.handle} !border-background !w-2.5 !h-2.5`}
      />

      {/* Top Row: Icon + Classification + Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}
          >
            {isCleanStatus ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : isCritical ? (
              <ShieldAlert className="w-3.5 h-3.5" />
            ) : isHigh ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <FileCode2 className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            {isCleanStatus ? "Posture Check" : "Vulnerability"}
          </span>
        </div>
        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${styles.badge}`}>
          {isCleanStatus ? "SECURE" : styles.label}
        </span>
      </div>

      {/* Title & Target Endpoint */}
      <div className="mt-2.5">
        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate font-mono" title={data.label}>
          {data.label}
        </h4>
        <p className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 truncate mt-0.5" title={data.metadata?.url}>
          {isCleanStatus
            ? "Perimeter verified clean"
            : data.metadata?.url?.replace(/^https?:\/\//, "") || data.surface}
        </p>
      </div>

      {/* Bottom Row: Standards & CVSS */}
      <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-slate-200 dark:border-zinc-800">
        <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-400 truncate max-w-[130px]">
          {data.cwe_id || data.surface || "Security Triage"}
        </span>
        {data.cvss_score ? (
          <span className="text-[10px] font-mono font-black text-rose-600 dark:text-rose-400">
            CVSS {data.cvss_score}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
            Passive Intel
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className={`${styles.handle} !border-background !w-2.5 !h-2.5`}
      />
    </div>
  );
});

FindingNode.displayName = "FindingNode";
