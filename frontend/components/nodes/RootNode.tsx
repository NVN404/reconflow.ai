import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Globe } from "lucide-react";
import { NodeData } from "@/lib/types";

interface RootNodeProps {
  data: NodeData & { layoutDirection?: "TB" | "LR" };
  selected?: boolean;
}

export const RootNode = memo(({ data, selected }: RootNodeProps) => {
  const isHorizontal = data.layoutDirection === "LR";

  return (
    <div
      className={`relative w-[260px] p-4 rounded-lg bg-[#0B0B0B] border transition-all duration-200 cursor-pointer ${
        selected
          ? "border-[#F7F7F5] ring-2 ring-[#B7E36A]/40 shadow-xl shadow-[#B7E36A]/5 bg-[#111111]"
          : "border-[#292929] hover:border-[#383838] hover:bg-[#111111] shadow-lg"
      }`}
    >
      {/* Top Row: Icon + Category Label */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#111111] border border-[#292929] text-[#B7E36A] flex items-center justify-center flex-shrink-0 shadow-inner">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#A0A09C] uppercase tracking-wider">
            Apex Target
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#111111] text-[#B7E36A] border border-[#B7E36A]/30 uppercase">
          ROOT
        </span>
      </div>

      {/* Main Title: Domain Name */}
      <h3 className="text-sm font-bold text-[#F7F7F5] font-mono truncate mt-2.5 tracking-tight" title={data.label}>
        {data.label}
      </h3>

      {/* Bottom Row: Surface Telemetry & Status */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#292929]">
        <span className="text-[11px] font-mono text-[#6F6F6B] truncate max-w-[150px]">
          {data.surface || "Apex DNS Target"}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#B7E36A] flex-shrink-0" />
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className="!bg-[#B7E36A] !border-[#050505] !w-2.5 !h-2.5 shadow-sm"
      />
    </div>
  );
});

RootNode.displayName = "RootNode";
