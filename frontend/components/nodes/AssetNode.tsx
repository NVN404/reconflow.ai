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
      className={`relative w-[260px] p-4 rounded-lg bg-[#0B0B0B] border transition-all duration-200 cursor-pointer ${
        selected
          ? "border-[#F7F7F5] ring-2 ring-[#F7F7F5]/20 shadow-lg bg-[#111111]"
          : "border-[#292929] hover:border-[#383838] hover:bg-[#111111]"
      }`}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className="!bg-[#6F6F6B] !border-[#050505] !w-2.5 !h-2.5"
      />

      {/* Top Row: Icon + Type Label */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#111111] text-[#A0A09C] flex items-center justify-center flex-shrink-0 border border-[#292929]">
            <Server className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono font-medium text-[#A0A09C] uppercase tracking-wider">
            Host Asset
          </span>
        </div>
        <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded bg-[#111111] text-[#A0A09C] border border-[#292929]">
          ASSET
        </span>
      </div>

      {/* Main Title */}
      <h3 className="text-xs font-semibold text-[#F7F7F5] truncate mt-2.5 font-mono" title={data.label}>
        {data.label}
      </h3>

      {/* Bottom Row */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#292929]">
        <span className="text-[11px] font-mono text-[#6F6F6B] truncate max-w-[160px]">
          {data.surface || data.engine || "Subdomain Asset"}
        </span>
        <span className="text-[10px] font-mono text-[#6F6F6B]">
          ACTIVE
        </span>
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className="!bg-[#6F6F6B] !border-[#050505] !w-2.5 !h-2.5"
      />
    </div>
  );
});

AssetNode.displayName = "AssetNode";
