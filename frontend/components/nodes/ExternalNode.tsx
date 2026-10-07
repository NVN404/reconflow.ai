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
  Cloud,
} from "lucide-react";
import { NodeData } from "@/lib/types";

interface ExternalNodeProps {
  data: NodeData & { layoutDirection?: "TB" | "LR" };
  selected?: boolean;
}

const getCategoryStyles = (cat?: string, isCritical?: boolean) => {
  if (cat === "YOUTUBE_POC") {
    return {
      icon: <Youtube className="w-3.5 h-3.5" />,
      tag: "EXPLOIT RADAR",
      card: "bg-white dark:bg-[#0c0c0c] border-2 border-red-500/90 dark:border-red-600 hover:border-red-500 shadow-md",
      badge: "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800",
      iconBg: "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800",
      handle: "!bg-red-500",
      selected: "bg-white dark:bg-[#0c0c0c] border-2 border-red-500 ring-4 ring-red-500/30 shadow-xl",
    };
  }

  if (cat === "MOBILE_APP") {
    return {
      icon: <Smartphone className="w-3.5 h-3.5" />,
      tag: "MOBILE ASSET",
      card: "bg-white dark:bg-[#0c0c0c] border-2 border-emerald-500/80 dark:border-emerald-600 hover:border-emerald-500 shadow-md",
      badge: "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800",
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
      handle: "!bg-emerald-500",
      selected: "bg-white dark:bg-[#0c0c0c] border-2 border-emerald-500 ring-4 ring-emerald-500/30 shadow-xl",
    };
  }

  if (cat === "NEWS_BREACH") {
    return {
      icon: <Newspaper className="w-3.5 h-3.5" />,
      tag: "THREAT INTEL",
      card: "bg-white dark:bg-[#0c0c0c] border-2 border-amber-500/80 dark:border-amber-600 hover:border-amber-500 shadow-md",
      badge: "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800",
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
      handle: "!bg-amber-500",
      selected: "bg-white dark:bg-[#0c0c0c] border-2 border-amber-500 ring-4 ring-amber-500/30 shadow-xl",
    };
  }

  if (cat === "TOKEN_LEAK" || isCritical) {
    return {
      icon: <KeyRound className="w-3.5 h-3.5" />,
      tag: "SECRET LEAK",
      card: "bg-white dark:bg-[#0c0c0c] border-2 border-rose-500 hover:border-rose-600 shadow-md",
      badge: "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800",
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800",
      handle: "!bg-rose-500",
      selected: "bg-white dark:bg-[#0c0c0c] border-2 border-rose-500 ring-4 ring-rose-500/30 shadow-xl",
    };
  }

  if (cat === "DOCUMENT_LEAK") {
    return {
      icon: <FileText className="w-3.5 h-3.5" />,
      tag: "EXPOSED DOC",
      card: "bg-white dark:bg-[#0c0c0c] border-2 border-teal-500/80 dark:border-teal-600 hover:border-teal-500 shadow-md",
      badge: "bg-teal-100 text-teal-800 border border-teal-300 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800",
      iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-200 dark:border-teal-800",
      handle: "!bg-teal-500",
      selected: "bg-white dark:bg-[#0c0c0c] border-2 border-teal-500 ring-4 ring-teal-500/30 shadow-xl",
    };
  }

  if (cat === "CLOUD_BUCKET" || cat === "S3_BUCKET") {
    return {
      icon: <Cloud className="w-3.5 h-3.5" />,
      tag: "STORAGE BUCKET",
      card: "bg-white dark:bg-[#0c0c0c] border-2 border-indigo-400 dark:border-indigo-700 hover:border-indigo-500 shadow-md",
      badge: "bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800",
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800",
      handle: "!bg-indigo-500",
      selected: "bg-white dark:bg-[#0c0c0c] border-2 border-indigo-500 ring-4 ring-indigo-500/30 shadow-xl",
    };
  }

  if (cat === "GITHUB_LEAK" || cat === "GITHUB_REPO") {
    return {
      icon: <Github className="w-3.5 h-3.5" />,
      tag: "GITHUB REPO",
      card: "bg-white dark:bg-[#0c0c0c] border-2 border-purple-500/80 dark:border-purple-700 hover:border-purple-500 shadow-md",
      badge: "bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800",
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
      handle: "!bg-purple-500",
      selected: "bg-white dark:bg-[#0c0c0c] border-2 border-purple-500 ring-4 ring-purple-500/30 shadow-xl",
    };
  }

  return {
    icon: <Database className="w-3.5 h-3.5" />,
    tag: "EXTERNAL INTEL",
    card: "bg-white dark:bg-[#0c0c0c] border-2 border-violet-400 dark:border-violet-700 hover:border-violet-500 shadow-md",
    badge: "bg-violet-100 text-violet-800 border border-violet-300 dark:bg-violet-950/80 dark:text-violet-300 dark:border-violet-800",
    iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 border border-violet-200 dark:border-violet-800",
    handle: "!bg-violet-500",
    selected: "bg-white dark:bg-[#0c0c0c] border-2 border-violet-500 ring-4 ring-violet-500/30 shadow-xl",
  };
};

export const ExternalNode = memo(({ data, selected }: ExternalNodeProps) => {
  const isHorizontal = data.layoutDirection === "LR";
  const isCritical = data.severity === "CRITICAL";
  const theme = getCategoryStyles(data.category, isCritical);

  return (
    <div
      className={`relative w-[260px] p-4 rounded-xl transition-all duration-200 cursor-pointer ${
        selected ? theme.selected : theme.card
      }`}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className={`${theme.handle} !border-background !w-2.5 !h-2.5`}
      />

      {/* Top Row: Contextual Icon + Zone Tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${theme.iconBg}`}
          >
            {theme.icon}
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            {theme.tag}
          </span>
        </div>
        <span
          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${theme.badge}`}
        >
          {data.engine?.toUpperCase() || "INTEL"}
        </span>
      </div>

      {/* Middle Title */}
      <div className="mt-2.5">
        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate font-mono" title={data.label}>
          {data.label}
        </h4>
        <p className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 truncate mt-0.5" title={data.metadata?.url}>
          {data.metadata?.url?.replace(/^https?:\/\//, "") || data.surface}
        </p>
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-slate-200 dark:border-zinc-800">
        <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-400 truncate max-w-[150px]">
          {data.surface || "External Intel"}
        </span>
        <span className="text-[10px] font-mono text-slate-700 dark:text-zinc-300 font-bold flex items-center gap-1">
          Source <ExternalLink className="w-2.5 h-2.5" />
        </span>
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className={`${theme.handle} !border-background !w-2.5 !h-2.5`}
      />
    </div>
  );
});

ExternalNode.displayName = "ExternalNode";

