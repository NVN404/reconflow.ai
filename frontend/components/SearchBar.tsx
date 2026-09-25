import React, { useState } from "react";
import { Search, Sparkles, Globe2, Radio, Zap, CheckCircle2 } from "lucide-react";

interface SearchBarProps {
  onScan: (domain: string, enablePhase2: boolean) => void;
  isScanning: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onScan, isScanning }) => {
  const [domain, setDomain] = useState("excalidraw.com");
  const [enablePhase2, setEnablePhase2] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    onScan(domain.trim(), enablePhase2);
  };

  const handleQuickTarget = (targetDomain: string) => {
    setDomain(targetDomain);
    onScan(targetDomain, true);
  };

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center gap-3">
        {/* Input Field */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Globe2 className="w-4 h-4 text-sky-400" />
          </div>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter target enterprise domain (e.g. excalidraw.com, stripe.com)"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0f141c]/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all text-sm font-mono shadow-inner"
            disabled={isScanning}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Main Recon Trigger */}
          <button
            type="submit"
            disabled={isScanning}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sweeping All Engines...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Execute Live Recon</span>
              </>
            )}
          </button>

          {/* Quick Target Button */}
          <button
            type="button"
            onClick={() => handleQuickTarget("excalidraw.com")}
            disabled={isScanning}
            className="px-4 py-3 rounded-xl bg-[#0f141c]/90 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-sky-300 font-medium text-xs shadow-md transition-all duration-150 active:scale-95 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Scan live verified target excalidraw.com"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Target: excalidraw.com</span>
          </button>
        </div>
      </form>

      {/* Mode Controls */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>100% Live Recon (Zero Cache)</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none opacity-90 hover:opacity-100 transition">
            <input
              type="checkbox"
              checked={enablePhase2}
              onChange={(e) => setEnablePhase2(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-purple-400 focus:ring-offset-slate-950"
            />
            <span className="font-mono text-purple-300">Phase 2: Threat Radar (YouTube / Play / GitHub / S3)</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          {/* 100% Pure SerpApi Engines Status */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] flex-wrap">
            <span className="text-sky-400 font-semibold flex items-center gap-1 mr-1">
              <Zap className="w-3 h-3 text-amber-400" />
              SerpApi Engines:
            </span>
            {(["Google", "Bing", "DuckDuckGo", "YouTube", "Google News", "Google Play"] as const).map((engine) => (
              <span
                key={engine}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-950/40 border border-sky-800/40 text-sky-300 font-mono text-[10px]"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                {engine}
              </span>
            ))}
          </div>

          <div className="font-mono text-[11px] text-slate-400 hidden xl:block">
            Orchestration: <span className="text-cyan-400 font-semibold">6 SerpApi Engines (Pure Dorking)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

