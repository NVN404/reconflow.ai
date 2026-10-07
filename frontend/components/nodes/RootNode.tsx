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
      className={`relative w-[260px] p-4 rounded-xl transition-all duration-200 cursor-pointer ${
        selected
          ? "bg-white dark:bg-[#0c0c0c] border-2 border-emerald-500 dark:border-lime ring-4 ring-emerald-500/30 dark:ring-lime/30 shadow-xl"
          : "bg-white dark:bg-[#0c0c0c] border-2 border-emerald-500/80 dark:border-lime/70 hover:border-emerald-600 dark:hover:border-lime shadow-md"
      }`}
    >
      {/* Top Row: Icon + Category Label */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-700 dark:bg-lime/10 dark:text-lime border border-emerald-200 dark:border-lime/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            Apex Target
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-lime/20 dark:text-lime dark:border-lime/40 uppercase">
          ROOT
        </span>
      </div>

      {/* Main Title: Domain Name */}
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 font-mono truncate mt-2.5 tracking-tight" title={data.label}>
        {data.label}
      </h3>

      {/* Bottom Row: Surface Telemetry & Status */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-200 dark:border-zinc-800">
        <span className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 truncate max-w-[150px]">
          {data.surface || "Apex DNS Target"}
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-lime flex-shrink-0 animate-pulse" />
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className="!bg-emerald-500 dark:!bg-lime !border-background !w-2.5 !h-2.5 shadow-sm"
      />
    </div>
  );
});

RootNode.displayName = "RootNode";
