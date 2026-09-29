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
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />;
      case "success":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="rounded-lg bg-surface-elevated border border-border shadow-lg overflow-hidden font-mono">
      {/* Header bar */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-4 py-3 bg-surface border-b border-border flex items-center justify-between cursor-pointer hover:bg-surface-hover transition select-none"
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-lime" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Live Telemetry Stream
          </span>
          {isScanning && (
            <span className="flex items-center gap-1.5 text-[10px] text-lime bg-lime/10 border border-lime/30 px-2 py-0.5 rounded font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-lime animate-ping" /> Active Sweep
            </span>
          )}
        </div>

        <button className="text-foreground-secondary hover:text-foreground transition">
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Stream contents */}
      {!collapsed && (
        <div className="p-4 h-48 overflow-y-auto space-y-2 text-xs text-foreground-secondary bg-background/90">
          {thoughts.length === 0 ? (
            <p className="text-foreground-muted italic text-xs">Agent standing by. Execute scan to initialize telemetry feed.</p>
          ) : (
            thoughts.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 leading-normal">
                <span className="text-[11px] text-foreground-muted select-none mt-0.5" suppressHydrationWarning>
                  [{item.timestamp}]
                </span>
                <span className="mt-0.5">{getStatusIcon(item.status)}</span>
                <span className="text-[10px] font-bold text-foreground-secondary bg-surface-elevated border border-border px-1.5 py-0.5 rounded">
                  {item.stage}
                </span>
                <span
                  className={`flex-1 text-xs ${
                    item.status === "critical"
                      ? "text-rose-400 font-semibold"
                      : item.status === "warning"
                      ? "text-orange-400"
                      : item.status === "success"
                      ? "text-emerald-400"
                      : "text-foreground-secondary"
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
