import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ShieldAlert, Globe } from "lucide-react";
import { NodeData } from "@/lib/types";

interface RootNodeProps {
  data: NodeData;
  selected?: boolean;
}

export const RootNode = memo(({ data, selected }: RootNodeProps) => {
  return (
    <div
      className={`relative px-5 py-3 rounded-xl bg-slate-900/90 backdrop-blur-md border transition-all duration-300 shadow-xl ${
        selected
          ? "border-sky-400 ring-2 ring-sky-400/40 shadow-sky-500/20"
          : "border-sky-500/40 hover:border-sky-400 shadow-black/40"
      }`}
      style={{ minWidth: "220px" }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
          <Globe className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold tracking-wider text-sky-400 uppercase bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
              Apex Domain
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 tracking-wide mt-0.5 truncate max-w-[180px]">
            {data.label}
          </h3>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-sky-400 !border-slate-900"
      />
    </div>
  );
});

RootNode.displayName = "RootNode";
