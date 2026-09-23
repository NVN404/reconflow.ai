import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { AlertTriangle, FileCode2, ShieldAlert } from "lucide-react";
import { NodeData } from "@/lib/types";

interface FindingNodeProps {
  data: NodeData;
  selected?: boolean;
}

export const FindingNode = memo(({ data, selected }: FindingNodeProps) => {
  const isCritical = data.severity === "CRITICAL";

  return (
    <div
      className={`relative px-4 py-3 rounded-lg bg-slate-900/95 backdrop-blur-md border transition-all duration-300 shadow-lg ${
        isCritical
          ? selected
            ? "border-red-500 ring-2 ring-red-500/50 shadow-red-500/30"
            : "border-red-500/80 animate-pulse-fast shadow-red-950/40"
          : selected
          ? "border-amber-400 ring-2 ring-amber-400/40"
          : "border-amber-500/50 hover:border-amber-400 shadow-amber-950/30"
      }`}
      style={{ minWidth: "210px" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`!border-slate-900 ${
          isCritical ? "!bg-red-500" : "!bg-amber-400"
        }`}
      />

      <div className="flex items-start gap-2.5">
        <div
          className={`p-1.5 rounded-md mt-0.5 ${
            isCritical
              ? "bg-red-500/20 text-red-400 border border-red-500/40"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
          }`}
        >
          {isCritical ? (
            <ShieldAlert className="w-4 h-4" />
          ) : (
            <FileCode2 className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                isCritical
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {data.severity}
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
            {data.metadata?.url?.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </div>
    </div>
  );
});

FindingNode.displayName = "FindingNode";
