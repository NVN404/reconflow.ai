import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { AlertTriangle, FileCode2, ShieldAlert, ShieldCheck } from "lucide-react";
import { NodeData } from "@/lib/types";

interface FindingNodeProps {
  data: NodeData;
  selected?: boolean;
}

export const FindingNode = memo(({ data, selected }: FindingNodeProps) => {
  const isCleanStatus = data.category === "VULN_STATUS_CLEAN";
  const isCritical = data.severity === "CRITICAL" && !isCleanStatus;

  // Strict Color Discipline: RED is only used if isCritical is true (actual vulnerability/leak)
  let containerStyle = "border-amber-500/50 hover:border-amber-400 shadow-amber-950/30";
  let handleColor = "!bg-amber-400";
  let iconTheme = "bg-amber-500/20 text-amber-400 border border-amber-500/40";
  let badgeStyle = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  let badgeText: string = data.severity;
  let icon = <FileCode2 className="w-4 h-4" />;

  if (isCleanStatus) {
    containerStyle = selected
      ? "border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-950/40"
      : "border-emerald-500/60 hover:border-emerald-400 shadow-emerald-950/30";
    handleColor = "!bg-emerald-500";
    iconTheme = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
    badgeStyle = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
    badgeText = "PERIMETER SECURE";
    icon = <ShieldCheck className="w-4 h-4" />;
  } else if (isCritical) {
    containerStyle = selected
      ? "border-red-500 ring-2 ring-red-500/50 shadow-red-500/30"
      : "border-red-500/80 animate-pulse-fast shadow-red-950/40";
    handleColor = "!bg-red-500";
    iconTheme = "bg-red-500/20 text-red-400 border border-red-500/40";
    badgeStyle = "bg-red-500/20 text-red-400 border border-red-500/30";
    badgeText = "CRITICAL EXPOSURE";
    icon = <ShieldAlert className="w-4 h-4" />;
  }

  return (
    <div
      className={`relative px-4 py-3 rounded-lg bg-slate-900/95 backdrop-blur-md border transition-all duration-300 shadow-lg ${containerStyle}`}
      style={{ minWidth: "220px" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`!border-slate-900 ${handleColor}`}
      />

      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-md mt-0.5 ${iconTheme}`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${badgeStyle}`}
            >
              {badgeText}
            </span>
            {data.cwe_id && (
              <span className="text-[9px] font-mono text-slate-400">
                {data.cwe_id}
              </span>
            )}
          </div>

          <h4 className="text-xs font-semibold text-slate-100 truncate mt-1">
            {data.label}
          </h4>

          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {isCleanStatus
              ? "All perimeter gateways verified"
              : data.metadata?.url?.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </div>
    </div>
  );
});

FindingNode.displayName = "FindingNode";

