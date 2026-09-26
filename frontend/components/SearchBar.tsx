import React, { useState } from "react";
import {
  Search,
  Sparkles,
  Globe2,
  Radio,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Cloud,
  Github,
  Youtube,
  Smartphone,
  Newspaper,
  Terminal,
} from "lucide-react";

interface SearchBarProps {
  onScan: (
    domain: string,
    enablePhase2: boolean,
    customDorks?: string[],
    enabledVectors?: Record<string, boolean>
  ) => void;
  isScanning: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onScan, isScanning }) => {
  const [domain, setDomain] = useState("reconflow.ai");
  const [enablePhase2, setEnablePhase2] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  // Phase 2 Vector Toggles
  const [vectorCloud, setVectorCloud] = useState(true);
  const [vectorGithub, setVectorGithub] = useState(true);
  const [vectorYoutube, setVectorYoutube] = useState(true);
  const [vectorPlay, setVectorPlay] = useState(true);
  const [vectorNews, setVectorNews] = useState(true);
  const [vectorFootprint, setVectorFootprint] = useState(true);

  // Custom User Dorks (Ungated Hunting)
  const [customDorkInput, setCustomDorkInput] = useState("");
  const [customDorks, setCustomDorks] = useState<string[]>([]);

  const handleAddCustomDork = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customDorkInput.trim();
    if (!trimmed) return;
    if (customDorks.length >= 2) {
      alert("Maximum 2 custom dorks allowed to conserve SerpApi credits.");
      return;
    }
    if (!customDorks.includes(trimmed)) {
      setCustomDorks((prev) => [...prev, trimmed]);
      setCustomDorkInput("");
    }
  };

  const handleRemoveCustomDork = (dorkToRemove: string) => {
    setCustomDorks((prev) => prev.filter((d) => d !== dorkToRemove));
  };

  const getEnabledVectors = () => ({
    cloud: vectorCloud,
    github: vectorGithub,
    youtube: vectorYoutube,
    play: vectorPlay,
    news: vectorNews,
    footprint: vectorFootprint,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    onScan(domain.trim(), enablePhase2, customDorks, getEnabledVectors());
  };

  const handleQuickTarget = (targetDomain: string) => {
    setDomain(targetDomain);
    onScan(targetDomain, true, customDorks, getEnabledVectors());
  };

  return (
    <div className="w-full space-y-3 font-sans">
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
            placeholder="Enter target domain (e.g. reconflow.ai, yourcompany.com)"
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
            onClick={() => handleQuickTarget("reconflow.ai")}
            disabled={isScanning}
            className="px-4 py-3 rounded-xl bg-[#0f141c]/90 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-sky-300 font-medium text-xs shadow-md transition-all duration-150 active:scale-95 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Scan verified domain reconflow.ai"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Target: reconflow.ai</span>
          </button>

          {/* Dork Strategy Config Toggle */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3.5 py-3 rounded-xl border text-xs font-mono transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              showConfig || customDorks.length > 0
                ? "bg-purple-950/50 border-purple-500/60 text-purple-300 ring-1 ring-purple-500/30"
                : "bg-[#0f141c]/90 hover:bg-slate-800/80 border-slate-800 text-slate-300"
            }`}
            title="Configure Dork Matrix & Custom Signatures"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Dork Matrix</span>
            {customDorks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-[10px] font-bold text-purple-200">
                +{customDorks.length}
              </span>
            )}
            {showConfig ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        </div>
      </form>

      {/* Mode Controls Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Hybrid Recon (Passive Search + Light-Touch Telemetry)</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none opacity-90 hover:opacity-100 transition">
            <input
              type="checkbox"
              checked={enablePhase2}
              onChange={(e) => setEnablePhase2(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-purple-400 focus:ring-offset-slate-950"
            />
            <span className="font-mono text-purple-300">Phase 2: External Threat Radar</span>
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

      {/* Expandable Phase 2 Radar & Ungated Dork Inspector */}
      {showConfig && (
        <div className="p-4 rounded-2xl bg-[#0b0e14]/95 border border-purple-500/30 shadow-xl backdrop-blur-md space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                  Phase 2 Threat Radar Config &amp; Dork Strategy Inspector
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Inspect, toggle, and customize live SerpApi dork signatures. Zero black-box gatekeeping.
              </p>
            </div>
            <div className="text-[10px] font-mono text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-1 rounded">
              Active Signatures: {Object.values(getEnabledVectors()).filter(Boolean).length} / 6
            </div>
          </div>

          {/* Vector Toggle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {/* Cloud Storage */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#141a24] border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorCloud}
                onChange={(e) => setVectorCloud(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Cloud className="w-3.5 h-3.5 text-sky-400" />
                  <span>Multi-Cloud Bucket Hunter</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  AWS S3, Azure Blob, GCS, DO Spaces
                </p>
              </div>
            </label>

            {/* GitHub Leaks */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#141a24] border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorGithub}
                onChange={(e) => setVectorGithub(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-red-500 focus:ring-red-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Github className="w-3.5 h-3.5 text-red-400" />
                  <span>GitHub Secret &amp; Key Leaks</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  .env, RSA keys, secrets.json, Gists
                </p>
              </div>
            </label>

            {/* YouTube Radar */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#141a24] border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorYoutube}
                onChange={(e) => setVectorYoutube(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Youtube className="w-3.5 h-3.5 text-rose-400" />
                  <span>YouTube Exploit Radar</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  Researcher PoC videos &amp; bug bounties
                </p>
              </div>
            </label>

            {/* Google Play */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#141a24] border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorPlay}
                onChange={(e) => setVectorPlay(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Play Mobile Perimeter</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  Client Android packages &amp; ratings
                </p>
              </div>
            </label>

            {/* Google News */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#141a24] border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorNews}
                onChange={(e) => setVectorNews(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Newspaper className="w-3.5 h-3.5 text-amber-400" />
                  <span>Threat Intelligence News</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  Breach disclosures &amp; security bulletins
                </p>
              </div>
            </label>

            {/* External Footprint */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#141a24] border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorFootprint}
                onChange={(e) => setVectorFootprint(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>External Directory Footprint</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  Tool catalogs, mentions &amp; marketplaces
                </p>
              </div>
            </label>
          </div>

          {/* Ungated Custom Dork Injector */}
          <div className="pt-2 border-t border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>Inject Custom SerpApi Threat-Hunting Dork (Ungated)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Variables: <code className="text-purple-300 font-bold">&#123;target&#125;</code>,{" "}
                <code className="text-purple-300 font-bold">&#123;brand&#125;</code>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customDorkInput}
                onChange={(e) => setCustomDorkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomDork(e))}
                placeholder='e.g. site:{target} inurl:grafana  OR  site:gitlab.com "{brand}" filename:.env'
                className="flex-1 px-3 py-2 rounded-xl bg-[#141a24] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <button
                type="button"
                onClick={handleAddCustomDork}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Dork</span>
              </button>
            </div>

            {/* Render Active Custom Dorks */}
            {customDorks.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] font-mono text-slate-400">Custom Queries:</span>
                {customDorks.map((dork) => (
                  <span
                    key={dork}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-700/60 text-purple-200 text-xs font-mono"
                  >
                    <span>{dork}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomDork(dork)}
                      className="text-purple-400 hover:text-white ml-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
