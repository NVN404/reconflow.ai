import React, { useState } from "react";
import {
  Search,
  Globe2,
  Radio,
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
  const [domain, setDomain] = useState("vulnweb.com");
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
            placeholder="Enter target domain (e.g. vulnweb.com)"
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
            onClick={() => handleQuickTarget("vulnweb.com")}
            disabled={isScanning}
            className="px-3.5 py-3 rounded-lg bg-[#0B0B0B] hover:bg-[#111111] border border-[#292929] text-zinc-300 font-medium text-xs transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Scan live security testbed vulnweb.com via SerpApi"
          >
            <span>Preset: vulnweb.com</span>
          </button>



          {/* Dork Strategy Config Toggle */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3.5 py-3 rounded-lg border text-xs font-mono transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              showConfig || customDorks.length > 0
                ? "bg-purple-950/50 border-purple-500/60 text-purple-300 ring-1 ring-purple-500/30"
                : "bg-[#0B0B0B] hover:bg-[#111111] border-[#292929] text-zinc-300"
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

      {/* Mode Controls */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 pt-1 gap-2 border-t border-zinc-800/60">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>100% Pure SerpApi Autonomous Recon</span>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-zinc-400 hover:text-zinc-200">
            <input
              type="checkbox"
              checked={enablePhase2}
              onChange={(e) => setEnablePhase2(e.target.checked)}
              className="rounded bg-[#111111] border-[#292929] text-[#B7E36A] focus:ring-[#B7E36A]"
            />
            <span className="font-mono text-purple-300">Phase 2: External Threat Radar</span>
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

      {/* Expandable Phase 2 Radar & Ungated Dork Inspector */}
      {showConfig && (
        <div className="p-4 rounded-xl bg-[#0B0B0B] border border-purple-500/30 shadow-xl backdrop-blur-md space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                  Phase 2 Threat Radar Config &amp; Dork Strategy Inspector
                </h4>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
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
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111111] border border-[#292929] hover:border-zinc-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorCloud}
                onChange={(e) => setVectorCloud(e.target.checked)}
                className="mt-0.5 rounded bg-[#0B0B0B] border-[#292929] text-sky-500 focus:ring-sky-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                  <Cloud className="w-3.5 h-3.5 text-sky-400" />
                  <span>Multi-Cloud Bucket Hunter</span>
                </div>
                <p className="text-[10px] font-mono text-zinc-400">
                  AWS S3, Azure Blob, GCS, DO Spaces
                </p>
              </div>
            </label>

            {/* GitHub Leaks */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111111] border border-[#292929] hover:border-zinc-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorGithub}
                onChange={(e) => setVectorGithub(e.target.checked)}
                className="mt-0.5 rounded bg-[#0B0B0B] border-[#292929] text-red-500 focus:ring-red-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                  <Github className="w-3.5 h-3.5 text-red-400" />
                  <span>GitHub Secret &amp; Key Leaks</span>
                </div>
                <p className="text-[10px] font-mono text-zinc-400">
                  .env, RSA keys, secrets.json, Gists
                </p>
              </div>
            </label>

            {/* YouTube Radar */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111111] border border-[#292929] hover:border-zinc-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorYoutube}
                onChange={(e) => setVectorYoutube(e.target.checked)}
                className="mt-0.5 rounded bg-[#0B0B0B] border-[#292929] text-rose-500 focus:ring-rose-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                  <Youtube className="w-3.5 h-3.5 text-rose-400" />
                  <span>YouTube Exploit Radar</span>
                </div>
                <p className="text-[10px] font-mono text-zinc-400">
                  Researcher PoC videos &amp; bug bounties
                </p>
              </div>
            </label>

            {/* Google Play */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111111] border border-[#292929] hover:border-zinc-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorPlay}
                onChange={(e) => setVectorPlay(e.target.checked)}
                className="mt-0.5 rounded bg-[#0B0B0B] border-[#292929] text-emerald-500 focus:ring-emerald-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Play Mobile Perimeter</span>
                </div>
                <p className="text-[10px] font-mono text-zinc-400">
                  Client Android packages &amp; ratings
                </p>
              </div>
            </label>

            {/* Google News */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111111] border border-[#292929] hover:border-zinc-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorNews}
                onChange={(e) => setVectorNews(e.target.checked)}
                className="mt-0.5 rounded bg-[#0B0B0B] border-[#292929] text-amber-500 focus:ring-amber-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                  <Newspaper className="w-3.5 h-3.5 text-amber-400" />
                  <span>Threat Intelligence News</span>
                </div>
                <p className="text-[10px] font-mono text-zinc-400">
                  Breach disclosures &amp; security bulletins
                </p>
              </div>
            </label>

            {/* External Footprint */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111111] border border-[#292929] hover:border-zinc-700 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={vectorFootprint}
                onChange={(e) => setVectorFootprint(e.target.checked)}
                className="mt-0.5 rounded bg-[#0B0B0B] border-[#292929] text-cyan-500 focus:ring-cyan-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>External Directory Footprint</span>
                </div>
                <p className="text-[10px] font-mono text-zinc-400">
                  Tool catalogs, mentions &amp; marketplaces
                </p>
              </div>
            </label>
          </div>

          {/* Ungated Custom Dork Injector */}
          <div className="pt-2 border-t border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>Inject Custom SerpApi Threat-Hunting Dork (Ungated)</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
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
                className="flex-1 px-3 py-2 rounded-lg bg-[#111111] border border-[#292929] text-zinc-100 placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={handleAddCustomDork}
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Dork</span>
              </button>
            </div>

            {/* Render Active Custom Dorks */}
            {customDorks.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] font-mono text-zinc-400">Custom Queries:</span>
                {customDorks.map((dork) => (
                  <span
                    key={dork}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-700/60 text-purple-200 text-xs font-mono"
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
