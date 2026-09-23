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
        return <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
      case "success":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden">
      {/* Header bar */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wide font-mono">
            Autonomous Agent Thought Stream
          </span>
          {isScanning && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> Active Sweep
            </span>
          )}
        </div>

        <button className="text-slate-400 hover:text-slate-200">
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Stream contents */}
      {!collapsed && (
        <div className="p-3.5 max-h-44 overflow-y-auto space-y-2 font-mono text-xs text-slate-300 bg-black/40">
          {thoughts.length === 0 ? (
            <p className="text-slate-500 italic">Agent standing by. Enter a target domain to initialize autonomous dorking.</p>
          ) : (
            thoughts.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-[10px] text-slate-500 font-mono select-none mt-0.5">
                  [{item.timestamp}]
                </span>
                <span className="mt-0.5">{getStatusIcon(item.status)}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800/80 px-1 rounded">
                  {item.stage}
                </span>
                <span
                  className={`flex-1 ${
                    item.status === "critical"
                      ? "text-red-300 font-semibold"
                      : item.status === "warning"
                      ? "text-amber-200"
                      : item.status === "success"
                      ? "text-emerald-300"
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
