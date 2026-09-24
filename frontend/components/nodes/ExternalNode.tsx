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

  // Strict Color Semantics: RED is exclusively reserved for confirmed critical security vulnerabilities
  let icon = <Database className="w-3.5 h-3.5" />;
  let iconTheme = "bg-[#3a2013] text-[#ff9d6b]";
  let borderTheme = selected
    ? "border-orange-500 ring-2 ring-orange-500/20"
    : "border-orange-500/40 hover:border-orange-400";
  let handleColor = "!bg-[#ff9d6b]";
  let badgeStyle = "bg-[#3a2013] text-[#ff9d6b]";
  let zoneTag = "EXTERNAL ASSET";

  if (cat === "YOUTUBE_POC") {
    // Calm Indigo theme — never red
    icon = <Youtube className="w-3.5 h-3.5" />;
    iconTheme = "bg-[#1e1b4b] text-[#818cf8]";
    borderTheme = selected
      ? "border-indigo-500 ring-2 ring-indigo-500/20"
      : "border-indigo-500/40 hover:border-indigo-400";
    handleColor = "!bg-[#818cf8]";
    badgeStyle = "bg-[#1e1b4b] text-[#818cf8]";
    zoneTag = "EXPLOIT RADAR";
  } else if (cat === "MOBILE_APP") {
    icon = <Smartphone className="w-3.5 h-3.5" />;
    iconTheme = "bg-[#0f2e22] text-[#4ade9b]";
    borderTheme = selected
      ? "border-emerald-500 ring-2 ring-emerald-500/20"
      : "border-emerald-500/40 hover:border-emerald-400";
    handleColor = "!bg-[#4ade9b]";
    badgeStyle = "bg-[#0f2e22] text-[#4ade9b]";
    zoneTag = "MOBILE ASSET";
  } else if (cat === "NEWS_BREACH") {
    icon = <Newspaper className="w-3.5 h-3.5" />;
    iconTheme = "bg-[#10253d] text-[#6fb2f5]";
    borderTheme = selected
      ? "border-sky-500 ring-2 ring-sky-500/20"
      : "border-sky-500/40 hover:border-sky-400";
    handleColor = "!bg-[#6fb2f5]";
    badgeStyle = "bg-[#10253d] text-[#6fb2f5]";
    zoneTag = "THREAT INTEL";
  } else if (cat === "GITHUB_LEAK") {
    icon = <Github className="w-3.5 h-3.5" />;
    if (isCritical) {
      iconTheme = "bg-[#3a1418] text-[#ff6b6a]";
      borderTheme = selected
        ? "border-[#ff6b6a] ring-2 ring-[#ff6b6a]/20 shadow-red-500/10"
        : "border-[#ff6b6a]/50 animate-pulse-subtle";
      handleColor = "!bg-[#ff6b6a]";
      badgeStyle = "bg-[#3a1418] text-[#ff6b6a]";
      zoneTag = "CRITICAL SECRET";
    } else {
      iconTheme = "bg-[#281b3b] text-[#c084fc]";
      borderTheme = selected
        ? "border-purple-500 ring-2 ring-purple-500/20"
        : "border-purple-500/40 hover:border-purple-400";
      handleColor = "!bg-[#c084fc]";
      badgeStyle = "bg-[#281b3b] text-[#c084fc]";
      zoneTag = "PUBLIC REPO";
    }
  } else if (cat === "TOKEN_LEAK" && isCritical) {
    icon = <KeyRound className="w-3.5 h-3.5" />;
    iconTheme = "bg-[#3a1418] text-[#ff6b6a]";
    borderTheme = selected
      ? "border-[#ff6b6a] ring-2 ring-[#ff6b6a]/20 shadow-red-500/10"
      : "border-[#ff6b6a]/50 animate-pulse-subtle";
    handleColor = "!bg-[#ff6b6a]";
    badgeStyle = "bg-[#3a1418] text-[#ff6b6a]";
    zoneTag = "VULNERABILITY";
  } else if (cat === "DOCUMENT_LEAK") {
    icon = <FileText className="w-3.5 h-3.5" />;
    iconTheme = "bg-[#3a2b0a] text-[#ffc26b]";
    borderTheme = selected
      ? "border-amber-500 ring-2 ring-amber-500/20"
      : "border-amber-500/40 hover:border-amber-400";
    handleColor = "!bg-[#ffc26b]";
    badgeStyle = "bg-[#3a2b0a] text-[#ffc26b]";
    zoneTag = "EXPOSED DOC";
  }

  return (
    <div
      className={`relative w-[240px] p-4 rounded-xl bg-[#141a24] border border-dashed transition-all duration-200 shadow-md ${borderTheme}`}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className={`${handleColor} !border-[#141a24] !w-2.5 !h-2.5`}
      />

      {/* Top Row: Icon + Type Label */}
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${iconTheme}`}
        >
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-400">
          {zoneTag}
        </span>
      </div>

      {/* Middle: Title */}
      <div className="mt-2.5">
        <h4 className="text-sm font-semibold text-slate-100 truncate" title={data.label}>
          {data.label}
        </h4>
        <p className="text-xs text-slate-400 truncate mt-0.5" title={data.metadata?.url}>
          {data.metadata?.url?.replace(/^https?:\/\//, "") || data.surface}
        </p>
      </div>

      {/* Bottom Row: Badge + Surface */}
      <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-white/[0.06]">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeStyle}`}
        >
          {data.engine || "EXTERNAL"}
        </span>
        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
          Source <ExternalLink className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
});

ExternalNode.displayName = "ExternalNode";
