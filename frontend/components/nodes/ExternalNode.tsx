import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  ExternalLink,
  Database,
  Github,
  Youtube,
  Smartphone,
  Newspaper,
  FileText,
  KeyRound,
} from "lucide-react";
import { NodeData } from "@/lib/types";

interface ExternalNodeProps {
  data: NodeData & { layoutDirection?: "TB" | "LR" };
  selected?: boolean;
}

export const ExternalNode = memo(({ data, selected }: ExternalNodeProps) => {
  const isHorizontal = data.layoutDirection === "LR";
  const isCritical = data.severity === "CRITICAL";
  const cat = data.category;

  let icon = <Database className="w-3.5 h-3.5 text-[#A0A09C]" />;
  let iconTheme = "bg-[#111111] text-[#A0A09C] border-[#292929]";
  let borderTheme = selected
    ? "border-[#F7F7F5] ring-2 ring-[#B7E36A]/30 bg-[#111111] shadow-lg"
    : "border-[#292929] hover:border-[#383838] hover:bg-[#111111]";
  let handleColor = "!bg-[#6F6F6B]";
  let badgeStyle = "bg-[#111111] text-[#A0A09C] border-[#292929]";
  let zoneTag = "EXTERNAL INTEL";

  if (cat === "YOUTUBE_POC") {
    icon = <Youtube className="w-3.5 h-3.5 text-[#A0A09C]" />;
    zoneTag = "EXPLOIT RADAR";
  } else if (cat === "MOBILE_APP") {
    icon = <Smartphone className="w-3.5 h-3.5 text-[#A0A09C]" />;
    zoneTag = "MOBILE ASSET";
  } else if (cat === "NEWS_BREACH") {
    icon = <Newspaper className="w-3.5 h-3.5 text-[#A0A09C]" />;
    zoneTag = "THREAT INTEL";
  } else if (cat === "GITHUB_LEAK" || cat === "GITHUB_REPO") {
    icon = <Github className="w-3.5 h-3.5 text-[#A0A09C]" />;
    if (isCritical) {
      iconTheme = "bg-rose-950/80 text-rose-300 border-rose-800/80";
      borderTheme = selected
        ? "border-rose-400 ring-2 ring-rose-500/30 bg-[#111111] shadow-lg"
        : "border-rose-900/60 hover:border-rose-700/80 hover:bg-[#111111]";
      handleColor = "!bg-rose-400";
      badgeStyle = "bg-rose-950/80 text-rose-300 border-rose-800/80";
      zoneTag = "SECRET LEAK";
    } else {
      zoneTag = "PUBLIC REPO";
    }
  } else if (cat === "TOKEN_LEAK" && isCritical) {
    icon = <KeyRound className="w-3.5 h-3.5 text-rose-300" />;
    iconTheme = "bg-rose-950/80 text-rose-300 border-rose-800/80";
    borderTheme = selected
      ? "border-rose-400 ring-2 ring-rose-500/30 bg-[#111111] shadow-lg"
      : "border-rose-900/60 hover:border-rose-700/80 hover:bg-[#111111]";
    handleColor = "!bg-rose-400";
    badgeStyle = "bg-rose-950/80 text-rose-300 border-rose-800/80";
    zoneTag = "CREDENTIAL LEAK";
  } else if (cat === "DOCUMENT_LEAK") {
    icon = <FileText className="w-3.5 h-3.5 text-[#B7E36A]" />;
    iconTheme = "bg-[#111111] text-[#B7E36A] border-[#B7E36A]/30";
    zoneTag = "EXPOSED DOC";
  }

  return (
    <div
      className={`relative w-[260px] p-4 rounded-lg bg-[#0B0B0B] border border-dashed transition-all duration-200 cursor-pointer ${borderTheme}`}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className={`${handleColor} !border-[#050505] !w-2.5 !h-2.5`}
      />

      {/* Top Row: Contextual Icon + Zone Tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border ${iconTheme}`}
          >
            {icon}
          </div>
          <span className="text-[10px] font-mono font-medium text-[#A0A09C] uppercase tracking-wider">
            {zoneTag}
          </span>
        </div>
        <span
          className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded border ${badgeStyle}`}
        >
          {data.engine || "EXTERNAL"}
        </span>
      </div>

      {/* Middle Title */}
      <div className="mt-2.5">
        <h4 className="text-xs font-semibold text-[#F7F7F5] truncate font-mono" title={data.label}>
          {data.label}
        </h4>
        <p className="text-[11px] font-mono text-[#6F6F6B] truncate mt-0.5" title={data.metadata?.url}>
          {data.metadata?.url?.replace(/^https?:\/\//, "") || data.surface}
        </p>
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-[#292929]">
        <span className="text-[10px] font-mono text-[#6F6F6B] truncate max-w-[150px]">
          {data.surface || "External Intel"}
        </span>
        <span className="text-[10px] font-mono text-[#A0A09C] flex items-center gap-1">
          Source <ExternalLink className="w-2.5 h-2.5 text-[#6F6F6B]" />
        </span>
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className={`${handleColor} !border-[#050505] !w-2.5 !h-2.5`}
      />
    </div>
  );
});

ExternalNode.displayName = "ExternalNode";
