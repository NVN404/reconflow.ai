import React, { useState } from "react";
import { Terminal, ChevronUp, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { AgentThought } from "@/lib/types";

interface ThoughtStreamProps {
  thoughts: AgentThought[];
  isScanning: boolean;
}

export const ThoughtStream: React.FC<ThoughtStreamProps> = ({ thoughts, isScanning }) => {
  const [collapsed, setCollapsed] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical":
        return <AlertCircle className="w-4 h-4 text-[#ff6b6a] flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-[#ffc26b] flex-shrink-0" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-[#4ade9b] flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-[#6fb2f5] flex-shrink-0" />;
    }
  };

  return (
    <div className="rounded-xl bg-[#141a24] border border-white/[0.08] shadow-lg overflow-hidden font-sans">
      {/* Header bar */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-4 py-3 bg-[#161c28] border-b border-white/[0.06] flex items-center justify-between cursor-pointer hover:bg-[#1a2230] transition select-none"
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-[#6fb2f5]" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            Autonomous Agent Thought Stream
          </span>
          {isScanning && (
            <span className="flex items-center gap-1.5 text-xs text-[#ffc26b] bg-[#3a2b0a] px-2.5 py-0.5 rounded-md font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffc26b] animate-ping" /> Active Sweep
            </span>
          )}
        </div>

        <button className="text-slate-400 hover:text-slate-200 transition">
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Stream contents - Fixed height container */}
      {!collapsed && (
        <div className="p-4 h-48 overflow-y-auto space-y-2.5 text-xs text-slate-300 bg-[#0d1117]/60">
          {thoughts.length === 0 ? (
            <p className="text-slate-500 italic text-xs font-sans">Agent standing by. Enter a target domain to initialize dorking scan.</p>
          ) : (
            thoughts.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 leading-normal">
                <span className="text-xs text-slate-500 font-mono select-none mt-0.5">
                  [{item.timestamp}]
                </span>
                <span className="mt-0.5">{getStatusIcon(item.status)}</span>
                <span className="text-xs font-medium text-slate-300 bg-[#1e2736] px-2 py-0.5 rounded-md">
                  {item.stage}
                </span>
                <span
                  className={`flex-1 text-xs font-sans ${
                    item.status === "critical"
                      ? "text-[#ff6b6a] font-medium"
                      : item.status === "warning"
                      ? "text-[#ffc26b]"
                      : item.status === "success"
                      ? "text-[#4ade9b]"
                      : "text-slate-300"
                  }`}
                >
                  {item.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};


