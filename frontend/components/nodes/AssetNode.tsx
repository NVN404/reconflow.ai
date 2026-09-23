import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Server } from "lucide-react";
import { NodeData } from "@/lib/types";

interface AssetNodeProps {
  data: NodeData & { layoutDirection?: "TB" | "LR" };
  selected?: boolean;
}

export const AssetNode = memo(({ data, selected }: AssetNodeProps) => {
  const isHorizontal = data.layoutDirection === "LR";

  return (
    <div
      className={`relative w-[240px] p-4 rounded-xl bg-[#141a24] border transition-all duration-200 shadow-md ${
        selected
          ? "border-teal-400/60 ring-2 ring-teal-400/20 shadow-teal-500/10"
          : "border-white/[0.08] hover:border-white/[0.18]"
      }`}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className="!bg-[#4ade9b] !border-[#141a24] !w-2.5 !h-2.5"
      />

      {/* Top Row: Icon + Type Label */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#0f2e22] text-[#4ade9b] flex items-center justify-center flex-shrink-0">
          <Server className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-medium text-slate-400">
          Host Asset
        </span>
      </div>

      {/* Main Line: Title */}
      <h3 className="text-sm font-semibold text-slate-100 truncate mt-2 leading-snug">
        {data.label}
      </h3>

      {/* Bottom Row: Subtitle + Severity Badge */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/[0.06]">
        <span className="text-xs text-slate-400 truncate max-w-[120px]">
          {data.surface || data.engine || "Subdomain"}
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#0f2e22] text-[#4ade9b]">
          Low
        </span>
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className="!bg-[#4ade9b] !border-[#141a24] !w-2.5 !h-2.5"
      />
    </div>
  );
});

AssetNode.displayName = "AssetNode";


