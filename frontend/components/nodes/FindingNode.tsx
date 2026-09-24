import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { FileCode2, ShieldAlert, ShieldCheck } from "lucide-react";
import { NodeData } from "@/lib/types";

interface FindingNodeProps {
  data: NodeData & { layoutDirection?: "TB" | "LR" };
  selected?: boolean;
}

const getSeverityStyles = (severity: string, isClean = false) => {
  if (isClean) {
    return {
      label: "Secure",
      badge: "bg-[#0f2e22] text-[#4ade9b]",
      iconBg: "bg-[#0f2e22] text-[#4ade9b]",
      handle: "!bg-[#4ade9b]",
      border: "border-emerald-500/40 hover:border-emerald-400/80 shadow-emerald-950/20",
    };
  }

  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return {
        label: "Critical",
        badge: "bg-[#3a1418] text-[#ff6b6a]",
        iconBg: "bg-[#3a1418] text-[#ff6b6a]",
        handle: "!bg-[#ff6b6a]",
        border: "border-[#ff6b6a]/50 hover:border-[#ff6b6a] shadow-red-950/30",
      };
    case "HIGH":
      return {
        label: "High",
        badge: "bg-[#3a2013] text-[#ff9d6b]",
        iconBg: "bg-[#3a2013] text-[#ff9d6b]",
        handle: "!bg-[#ff9d6b]",
        border: "border-orange-500/40 hover:border-orange-400 shadow-orange-950/20",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        badge: "bg-[#3a2b0a] text-[#ffc26b]",
        iconBg: "bg-[#3a2b0a] text-[#ffc26b]",
        handle: "!bg-[#ffc26b]",
        border: "border-amber-500/30 hover:border-amber-400 shadow-amber-950/20",
      };
    case "LOW":
      return {
        label: "Low",
        badge: "bg-[#0f2e22] text-[#4ade9b]",
        iconBg: "bg-[#0f2e22] text-[#4ade9b]",
        handle: "!bg-[#4ade9b]",
        border: "border-emerald-500/30 hover:border-emerald-400",
      };
    default:
      return {
        label: "Info",
        badge: "bg-[#10253d] text-[#6fb2f5]",
        iconBg: "bg-[#10253d] text-[#6fb2f5]",
        handle: "!bg-[#6fb2f5]",
        border: "border-sky-500/30 hover:border-sky-400",
      };
  }
};

export const FindingNode = memo(({ data, selected }: FindingNodeProps) => {
  const isHorizontal = data.layoutDirection === "LR";
  const isCleanStatus = data.category === "VULN_STATUS_CLEAN";
  const isCritical = data.severity === "CRITICAL" && !isCleanStatus;
  const styles = getSeverityStyles(data.severity, isCleanStatus);

  return (
    <div
      className={`relative w-[240px] p-4 rounded-xl bg-[#141a24] border transition-all duration-200 shadow-md ${
        isCleanStatus
          ? selected
            ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10"
            : styles.border
          : isCritical
          ? selected
            ? "border-[#ff6b6a] ring-2 ring-[#ff6b6a]/20 shadow-red-500/10"
            : "border-[#ff6b6a]/50 animate-pulse-subtle shadow-red-950/30"
          : selected
          ? "border-amber-400/60 ring-2 ring-amber-400/20"
          : styles.border
      }`}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className={`${styles.handle} !border-[#141a24] !w-2.5 !h-2.5`}
      />

      {/* Top Row: Icon + Type Label */}
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}
        >
          {isCleanStatus ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : isCritical ? (
            <ShieldAlert className="w-3.5 h-3.5 text-[#ff6b6a]" />
          ) : (
            <FileCode2 className="w-3.5 h-3.5" />
          )}
        </div>
        <span className="text-xs font-medium text-slate-400">
          {isCleanStatus ? "Perimeter Posture" : "Internal Finding"}
        </span>
      </div>

      {/* Middle: Title */}
      <div className="mt-2.5">
        <h4 className="text-sm font-semibold text-slate-100 truncate" title={data.label}>
          {data.label}
        </h4>
        <p className="text-xs text-slate-400 truncate mt-0.5" title={data.metadata?.url}>
          {isCleanStatus
            ? "All perimeter gateways verified"
            : data.metadata?.url?.replace(/^https?:\/\//, "") || data.surface}
        </p>
      </div>

      {/* Bottom Row: Severity Badge + CWE Tag */}
      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-white/[0.06]">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}
        >
          {isCleanStatus ? "PERIMETER SECURE" : styles.label}
        </span>
        {data.cwe_id && (
          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
            {data.cwe_id}
          </span>
        )}
      </div>
    </div>
  );
});

FindingNode.displayName = "FindingNode";
