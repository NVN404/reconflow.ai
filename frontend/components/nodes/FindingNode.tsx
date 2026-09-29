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
      badge: "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60",
      iconBg: "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60",
      handle: "!bg-emerald-400",
      border: "border-emerald-900/50 hover:border-emerald-700/70",
      selectedBorder: "border-emerald-400 ring-2 ring-emerald-500/30",
    };
  }

  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return {
        label: "CRITICAL",
        badge: "bg-rose-950/90 text-rose-300 border border-rose-800/80",
        iconBg: "bg-rose-950/80 text-rose-400 border border-rose-800/80",
        handle: "!bg-rose-400",
        border: "border-rose-900/60 hover:border-rose-700/80",
        selectedBorder: "border-rose-400 ring-2 ring-rose-500/30 shadow-rose-950/30",
      };
    case "HIGH":
      return {
        label: "HIGH",
        badge: "bg-orange-950/80 text-orange-300 border border-orange-800/60",
        iconBg: "bg-orange-950/80 text-orange-400 border border-orange-800/60",
        handle: "!bg-orange-400",
        border: "border-orange-900/50 hover:border-orange-700/70",
        selectedBorder: "border-orange-400 ring-2 ring-orange-500/30",
      };
    case "MEDIUM":
      return {
        label: "MEDIUM",
        badge: "bg-[#111111] text-[#F7F7F5] border border-[#292929]",
        iconBg: "bg-[#111111] text-[#F7F7F5] border border-[#292929]",
        handle: "!bg-[#6F6F6B]",
        border: "border-[#292929] hover:border-[#383838]",
        selectedBorder: "border-[#F7F7F5] ring-2 ring-[#B7E36A]/30",
      };
    case "LOW":
      return {
        label: "LOW",
        badge: "bg-[#111111] text-[#A0A09C] border border-[#292929]",
        iconBg: "bg-[#111111] text-[#A0A09C] border border-[#292929]",
        handle: "!bg-[#6F6F6B]",
        border: "border-[#292929] hover:border-[#383838]",
        selectedBorder: "border-[#F7F7F5] ring-2 ring-[#F7F7F5]/20",
      };
    default:
      return {
        label: "INFO",
        badge: "bg-[#111111] text-[#A0A09C] border border-[#292929]",
        iconBg: "bg-[#111111] text-[#A0A09C] border border-[#292929]",
        handle: "!bg-[#6F6F6B]",
        border: "border-[#292929] hover:border-[#383838]",
        selectedBorder: "border-[#F7F7F5] ring-2 ring-[#F7F7F5]/20",
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
      className={`relative w-[260px] p-4 rounded-lg bg-[#0B0B0B] border transition-all duration-200 cursor-pointer ${
        selected
          ? `${styles.selectedBorder} bg-[#111111] shadow-lg`
          : `${styles.border} hover:bg-[#111111]`
      }`}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className={`${styles.handle} !border-[#050505] !w-2.5 !h-2.5`}
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
          <span className="text-[10px] font-mono font-medium text-[#A0A09C] uppercase tracking-wider">
            {isCleanStatus ? "Posture Check" : "Vulnerability"}
          </span>
        </div>
        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${styles.badge}`}>
          {isCleanStatus ? "SECURE" : styles.label}
        </span>
      </div>

      {/* Title & Target Endpoint */}
      <div className="mt-2.5">
        <h4 className="text-xs font-semibold text-[#F7F7F5] truncate font-mono" title={data.label}>
          {data.label}
        </h4>
        <p className="text-[11px] font-mono text-[#6F6F6B] truncate mt-0.5" title={data.metadata?.url}>
          {isCleanStatus
            ? "Perimeter verified clean"
            : data.metadata?.url?.replace(/^https?:\/\//, "") || data.surface}
        </p>
      </div>

      {/* Bottom Row: Standards & CVSS */}
      <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-[#292929]">
        <span className="text-[10px] font-mono text-[#A0A09C] truncate max-w-[130px]">
          {data.cwe_id || data.surface || "Security Triage"}
        </span>
        {data.cvss_score ? (
          <span className="text-[10px] font-mono font-bold text-rose-400">
            CVSS {data.cvss_score}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-[#6F6F6B]">
            {data.engine || "PASSIVE"}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className={`${styles.handle} !border-[#050505] !w-2.5 !h-2.5`}
      />
    </div>
  );
});

FindingNode.displayName = "FindingNode";
