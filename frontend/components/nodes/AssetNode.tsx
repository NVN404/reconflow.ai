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
      className={`relative w-[260px] p-4 rounded-xl transition-all duration-200 cursor-pointer ${
        selected
          ? "bg-white dark:bg-[#0c0c0c] border-2 border-sky-500 ring-4 ring-sky-500/30 shadow-xl"
          : "bg-white dark:bg-[#0c0c0c] border-2 border-sky-400/80 dark:border-sky-800/80 hover:border-sky-500 shadow-md"
      }`}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className="!bg-sky-500 !border-background !w-2.5 !h-2.5"
      />

      {/* Top Row: Icon + Type Label */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-200 dark:border-sky-800">
            <Server className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            Host Asset
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800">
          ASSET
        </span>
      </div>

      {/* Main Title */}
      <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate mt-2.5 font-mono" title={data.label}>
        {data.label}
      </h3>

      {/* Bottom Row */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-200 dark:border-zinc-800">
        <span className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 truncate max-w-[160px]">
          {data.surface || data.engine || "Subdomain Asset"}
        </span>
        <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold">
          ACTIVE
        </span>
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className="!bg-sky-500 !border-background !w-2.5 !h-2.5"
      />
    </div>
  );
});

AssetNode.displayName = "AssetNode";
