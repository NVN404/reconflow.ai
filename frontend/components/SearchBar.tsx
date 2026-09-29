import React, { useState } from "react";
import { Search, Globe2, Radio, CheckCircle2 } from "lucide-react";

interface SearchBarProps {
  onScan: (domain: string, enablePhase2: boolean) => void;
  isScanning: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onScan, isScanning }) => {
  const [domain, setDomain] = useState("reconflow.ai");
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
    <div className="w-full space-y-3 font-mono">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
        {/* Input Field */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Globe2 className="w-4 h-4 text-zinc-500" />
          </div>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter target domain (e.g. reconflow.ai)"
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0B0B0B] border border-[#292929] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B7E36A] transition-all text-xs shadow-inner"
            disabled={isScanning}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="submit"
            disabled={isScanning}
            className="flex-1 sm:flex-none px-5 py-3 rounded-lg bg-zinc-100 hover:bg-white text-[#050505] font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isScanning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#050505] border-t-transparent rounded-full animate-spin" />
                <span>Sweeping Engines...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Execute Recon</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleQuickTarget("reconflow.ai")}
            disabled={isScanning}
            className="px-3.5 py-3 rounded-lg bg-[#0B0B0B] hover:bg-[#111111] border border-[#292929] text-zinc-300 font-medium text-xs transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Scan verified domain reconflow.ai"
          >
            <span>Preset: reconflow.ai</span>
          </button>
        </div>
      </form>

      {/* Mode Controls */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 pt-1 gap-2 border-t border-zinc-800/60">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-zinc-200">
            <Radio className="w-3 h-3 text-emerald-500" />
            <span>Hybrid Recon (Passive Intel + Telemetry)</span>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-zinc-400 hover:text-zinc-200">
            <input
              type="checkbox"
              checked={enablePhase2}
              onChange={(e) => setEnablePhase2(e.target.checked)}
              className="rounded bg-[#111111] border-[#292929] text-[#B7E36A] focus:ring-[#B7E36A]"
            />
            <span>Phase 2: Threat Radar (GitHub / S3 / YouTube)</span>
          </label>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-zinc-500">Engines:</span>
          {(["Google", "Bing", "DuckDuckGo", "YouTube", "Play"] as const).map((engine) => (
            <span
              key={engine}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0B0B0B] border border-[#292929] text-zinc-400 text-[10px]"
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-zinc-500" />
              {engine}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
