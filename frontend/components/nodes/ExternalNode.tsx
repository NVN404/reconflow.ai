import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ExternalLink, Database, Github, Youtube, Smartphone, Newspaper, FileText, KeyRound } from "lucide-react";
import { NodeData } from "@/lib/types";

interface ExternalNodeProps {
  data: NodeData;
  selected?: boolean;
}

export const ExternalNode = memo(({ data, selected }: ExternalNodeProps) => {
  const isCritical = data.severity === "CRITICAL";
  const cat = data.category;

  // Strict Color Semantics: RED is exclusively reserved for confirmed critical security vulnerabilities
  let icon = <Database className="w-4 h-4" />;
  let iconTheme = "bg-orange-500/20 text-orange-400 border-orange-500/30";
  let borderTheme = selected ? "border-orange-500 ring-2 ring-orange-500/40" : "border-orange-500/60 hover:border-orange-400";
  let handleColor = "!bg-orange-500";
  let badgeStyle = "bg-slate-800 text-slate-300";
  let zoneTag = "EXTERNAL ASSET";

  if (cat === "YOUTUBE_POC") {
    // Calm Indigo theme — never red
    icon = <Youtube className="w-4 h-4" />;
    iconTheme = "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
    borderTheme = selected ? "border-indigo-500 ring-2 ring-indigo-500/40" : "border-indigo-500/60 hover:border-indigo-400";
    handleColor = "!bg-indigo-500";
    badgeStyle = "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30";
    zoneTag = "EXPLOIT RADAR";
  } else if (cat === "MOBILE_APP") {
    icon = <Smartphone className="w-4 h-4" />;
    iconTheme = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    borderTheme = selected ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-emerald-500/60 hover:border-emerald-400";
    handleColor = "!bg-emerald-500";
    badgeStyle = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    zoneTag = "MOBILE ASSET";
  } else if (cat === "NEWS_BREACH") {
    icon = <Newspaper className="w-4 h-4" />;
    iconTheme = "bg-sky-500/20 text-sky-400 border-sky-500/30";
    borderTheme = selected ? "border-sky-500 ring-2 ring-sky-500/40" : "border-sky-500/60 hover:border-sky-400";
    handleColor = "!bg-sky-500";
    badgeStyle = "bg-sky-500/20 text-sky-400 border border-sky-500/30";
    zoneTag = "THREAT INTEL";
  } else if (cat === "GITHUB_LEAK") {
    icon = <Github className="w-4 h-4" />;
    if (isCritical) {
      iconTheme = "bg-red-500/20 text-red-400 border-red-500/30";
      borderTheme = selected ? "border-red-500 ring-2 ring-red-500/40" : "border-red-500/70 hover:border-red-400";
      handleColor = "!bg-red-500";
      badgeStyle = "bg-red-500/20 text-red-400 border border-red-500/30";
      zoneTag = "CRITICAL SECRET";
    } else {
      iconTheme = "bg-purple-500/20 text-purple-400 border-purple-500/30";
      borderTheme = selected ? "border-purple-500 ring-2 ring-purple-500/40" : "border-purple-500/60 hover:border-purple-400";
      handleColor = "!bg-purple-500";
      badgeStyle = "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      zoneTag = "PUBLIC REPO";
    }
  } else if (cat === "TOKEN_LEAK" && isCritical) {
    icon = <KeyRound className="w-4 h-4" />;
    iconTheme = "bg-red-500/20 text-red-400 border-red-500/30";
    borderTheme = selected ? "border-red-500 ring-2 ring-red-500/40" : "border-red-500/70 hover:border-red-400";
    handleColor = "!bg-red-500";
    badgeStyle = "bg-red-500/20 text-red-400 border border-red-500/30";
    zoneTag = "VULNERABILITY";
  } else if (cat === "DOCUMENT_LEAK") {
    icon = <FileText className="w-4 h-4" />;
    iconTheme = "bg-amber-500/20 text-amber-400 border-amber-500/30";
    borderTheme = selected ? "border-amber-500 ring-2 ring-amber-500/40" : "border-amber-500/60 hover:border-amber-400";
    handleColor = "!bg-amber-500";
    badgeStyle = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    zoneTag = "EXPOSED DOC";
  }

  return (
    <div
      className={`relative px-4 py-3 rounded-lg bg-slate-900/90 backdrop-blur-md border border-dashed transition-all duration-300 shadow-lg ${borderTheme}`}
      style={{ minWidth: "220px" }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`!border-slate-900 ${handleColor}`}
      />

      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-md mt-0.5 border ${iconTheme}`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${badgeStyle}`}>
              {zoneTag}
            </span>
            <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
              External <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>

          <h4 className="text-xs font-semibold text-slate-100 truncate mt-1">
            {data.label}
          </h4>

          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {data.surface}
          </p>
        </div>
      </div>
    </div>
  );
});

ExternalNode.displayName = "ExternalNode";
