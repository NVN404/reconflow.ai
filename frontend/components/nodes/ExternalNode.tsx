import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ExternalLink, Database, Github } from "lucide-react";
import { NodeData } from "@/lib/types";

interface ExternalNodeProps {
  data: NodeData;
  selected?: boolean;
}

export const ExternalNode = memo(({ data, selected }: ExternalNodeProps) => {
  const isGithub = data.category === "GITHUB_LEAK";
  const isCritical = data.severity === "CRITICAL";

  return (
    <div
      className={`relative px-4 py-3 rounded-lg bg-slate-900/90 backdrop-blur-md border border-dashed transition-all duration-300 shadow-lg ${
        isCritical
          ? selected
            ? "border-red-500 ring-2 ring-red-500/40"
            : "border-red-500/70 hover:border-red-400"
          : selected
          ? "border-orange-500 ring-2 ring-orange-500/40"
          : "border-orange-500/60 hover:border-orange-400"
      }`}
      style={{ minWidth: "210px" }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`!border-slate-900 ${
          isCritical ? "!bg-red-500" : "!bg-orange-500"
        }`}
      />

      <div className="flex items-start gap-2.5">
        <div
          className={`p-1.5 rounded-md mt-0.5 ${
            isGithub
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
          }`}
        >
          {isGithub ? (
            <Github className="w-4 h-4" />
          ) : (
            <Database className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                isCritical
                  ? "bg-red-500/20 text-red-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}
            >
              {data.severity}
            </span>
            <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
              External <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>

          <h4 className="text-xs font-semibold text-slate-100 truncate mt-1">
            {data.label}
          </h4>

          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {data.surface}
          </p>
        </div>
      </div>
    </div>
  );
});

ExternalNode.displayName = "ExternalNode";
