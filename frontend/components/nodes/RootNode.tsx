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
      className={`relative w-[240px] p-4 rounded-xl bg-[#141a24] border transition-all duration-200 shadow-xl ${
        selected
          ? "border-sky-400/60 ring-2 ring-sky-400/20 shadow-sky-500/10"
          : "border-white/[0.08] hover:border-white/[0.18]"
      }`}
    >
      {/* Top Row: Icon + Type Label */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#10253d] text-[#6fb2f5] flex items-center justify-center flex-shrink-0">
          <Globe className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-medium text-slate-400">
          Apex Domain
        </span>
      </div>

      {/* Main Line: Title */}
      <h3 className="text-sm font-semibold text-slate-100 truncate mt-2 leading-snug">
        {data.label}
      </h3>

      {/* Bottom Row: Subtitle + Severity Badge */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/[0.06]">
        <span className="text-xs text-slate-400 truncate max-w-[120px]">
          {data.surface || "Apex DNS"}
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#10253d] text-[#6fb2f5]">
          Info
        </span>
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className="!bg-[#6fb2f5] !border-[#141a24] !w-2.5 !h-2.5"
      />
    </div>
  );
});

RootNode.displayName = "RootNode";


