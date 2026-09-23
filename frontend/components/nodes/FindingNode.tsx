import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { FileCode2, ShieldAlert } from "lucide-react";
import { NodeData } from "@/lib/types";

interface FindingNodeProps {
  data: NodeData & { layoutDirection?: "TB" | "LR" };
  selected?: boolean;
}

const getSeverityStyles = (severity: string) => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return {
        label: "Critical",
        badge: "bg-[#3a1418] text-[#ff6b6a]",
        iconBg: "bg-[#3a1418] text-[#ff6b6a]",
        handle: "!bg-[#ff6b6a]",
      };
    case "HIGH":
      return {
        label: "High",
        badge: "bg-[#3a2013] text-[#ff9d6b]",
        iconBg: "bg-[#3a2013] text-[#ff9d6b]",
        handle: "!bg-[#ff9d6b]",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        badge: "bg-[#3a2b0a] text-[#ffc26b]",
        iconBg: "bg-[#3a2b0a] text-[#ffc26b]",
        handle: "!bg-[#ffc26b]",
      };
    case "LOW":
      return {
        label: "Low",
        badge: "bg-[#0f2e22] text-[#4ade9b]",
        iconBg: "bg-[#0f2e22] text-[#4ade9b]",
        handle: "!bg-[#4ade9b]",
      };
    default:
      return {
        label: "Info",
        badge: "bg-[#10253d] text-[#6fb2f5]",
        iconBg: "bg-[#10253d] text-[#6fb2f5]",
        handle: "!bg-[#6fb2f5]",
      };
  }
};

export const FindingNode = memo(({ data, selected }: FindingNodeProps) => {
  const isHorizontal = data.layoutDirection === "LR";
  const isCritical = data.severity === "CRITICAL";
  const styles = getSeverityStyles(data.severity);

  return (
    <div
      className={`relative w-[240px] p-4 rounded-xl bg-[#141a24] border transition-all duration-200 shadow-md ${
        isCritical
          ? selected
            ? "border-[#ff6b6a] ring-2 ring-[#ff6b6a]/20 shadow-red-500/10"
            : "border-[#ff6b6a]/40 animate-pulse-subtle"
          : selected
          ? "border-amber-400/60 ring-2 ring-amber-400/20"
          : "border-white/[0.08] hover:border-white/[0.18]"
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
          {isCritical ? (
            <ShieldAlert className="w-3.5 h-3.5" />
          ) : (
            <FileCode2 className="w-3.5 h-3.5" />
          )}
        </div>
        <span className="text-xs font-medium text-slate-400">
          Internal Finding
        </span>
      </div>

      {/* Main Line: Title */}
      <h3 className="text-sm font-semibold text-slate-100 truncate mt-2 leading-snug">
        {data.label}
      </h3>

      {/* Bottom Row: Subtitle + Severity Badge */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/[0.06]">
        <span className="text-xs text-slate-400 truncate max-w-[120px]">
          {data.cwe_id || data.surface || "Web Server"}
        </span>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-md ${styles.badge}`}
        >
          {styles.label}
        </span>
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className={`${styles.handle} !border-[#141a24] !w-2.5 !h-2.5`}
      />
    </div>
  );
});

FindingNode.displayName = "FindingNode";


