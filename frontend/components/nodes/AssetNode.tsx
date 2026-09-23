import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Server, Search } from "lucide-react";
import { NodeData } from "@/lib/types";

interface AssetNodeProps {
  data: NodeData;
  selected?: boolean;
}

export const AssetNode = memo(({ data, selected }: AssetNodeProps) => {
  const isBing = data.engine === "bing";

  return (
    <div
      className={`relative px-4 py-2.5 rounded-lg bg-slate-900/90 backdrop-blur-md border transition-all duration-200 shadow-md ${
        selected
          ? "border-blue-400 ring-2 ring-blue-400/30"
          : "border-slate-800 hover:border-blue-500/60"
      }`}
      style={{ minWidth: "190px" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-400 !border-slate-900"
      />

      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Server className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">
              Host Asset
            </span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                isBing
                  ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}
            >
              {data.engine || "google"}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
            {data.label}
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-400 !border-slate-900"
      />
    </div>
  );
});

AssetNode.displayName = "AssetNode";
