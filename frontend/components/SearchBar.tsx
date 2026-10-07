import React, { useState } from "react";
import {
  Search,
  Globe2,
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
  Zap,
  Bot,
  Info,
} from "lucide-react";

interface SearchBarProps {
  onScan: (
    domain: string,
    enablePhase2: boolean,
    customDorks?: string[],
    enabledVectors?: Record<string, boolean>,
    protocol?: "rest" | "mcp"
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

  const [protocol, setProtocol] = useState<"rest" | "mcp">("rest");
  const [showProtocolInfo, setShowProtocolInfo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    onScan(domain.trim(), enablePhase2, customDorks, getEnabledVectors(), protocol);
  };

  return (
    <div className="w-full space-y-3 font-mono">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
        {/* Input Field */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
            <Globe2 className="w-4 h-4 text-foreground-muted" />
          </div>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter target domain (e.g. vulnweb.com)"
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-lime transition-all text-xs shadow-sm"
            disabled={isScanning}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Protocol Engine Switch: REST vs SerpApi MCP */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-border text-xs shadow-sm">
            <button
              type="button"
              onClick={() => setProtocol("rest")}
              disabled={isScanning}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md font-mono text-[11px] font-bold transition-all ${
                protocol === "rest"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-foreground-muted hover:text-foreground border border-transparent"
              }`}
              title="Direct REST: High-throughput raw JSON extraction via standard SerpApi REST endpoints"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Direct REST</span>
              <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-foreground-muted font-normal">
                Raw JSON
              </span>
            </button>
            <button
              type="button"
              onClick={() => setProtocol("mcp")}
              disabled={isScanning}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md font-mono text-[11px] font-bold transition-all ${
                protocol === "mcp"
                  ? "bg-purple-500/15 dark:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/50 shadow-sm ring-1 ring-purple-500/30"
                  : "text-foreground-muted hover:text-foreground border border-transparent"
              }`}
              title="SerpApi MCP: Model Context Protocol 2026 stream via mcp.serpapi.com (-60% LLM token overhead)"
            >
              <Bot className="w-3.5 h-3.5 text-purple-500" />
              <span>SerpApi MCP</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-500/40 font-bold">
                -60% Tokens
              </span>
            </button>

            {/* Protocol Comparison Info Trigger */}
            <button
              type="button"
              onClick={() => setShowProtocolInfo(!showProtocolInfo)}
              className="px-1.5 py-1 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
              title="Why two protocols? Click to learn the difference."
            >
              <Info className="w-3.5 h-3.5 text-foreground-muted hover:text-foreground" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isScanning}
            className="flex-1 sm:flex-none px-5 py-3 rounded-lg bg-foreground hover:opacity-90 text-background font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isScanning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                <span>Sweeping Engines...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Execute Recon</span>
              </>
            )}
          </button>

          {/* Dork Strategy Config Toggle */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3.5 py-3 rounded-lg border text-xs font-mono transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm ${
              showConfig || customDorks.length > 0
                ? "bg-purple-500/15 border-purple-500/60 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30"
                : "bg-surface hover:bg-surface-elevated border-border text-foreground"
            }`}
            title="Configure Dork Matrix & Custom Signatures"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">Dork Matrix</span>
            {customDorks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-700 dark:text-purple-200">
                +{customDorks.length}
              </span>
            )}
            {showConfig ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        </div>
      </form>

      {/* Protocol Architecture Explanation Card */}
      {showProtocolInfo && (
        <div className="p-3.5 rounded-xl bg-surface border border-border text-xs font-mono space-y-2.5 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-lime" />
              Dual-Engine Protocol Architecture
            </span>
            <button
              type="button"
              onClick={() => setShowProtocolInfo(false)}
              className="text-foreground-muted hover:text-foreground p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300 text-[11px]">
                <Zap className="w-3.5 h-3.5" />
                ⚡ Direct REST API
              </div>
              <p className="text-[11px] text-foreground-secondary font-sans leading-relaxed">
                Queries <code className="text-amber-700 dark:text-amber-300 text-[10px]">serpapi.com/search</code> directly. Returns complete uncompressed SERP JSON payloads, cached pages, and full telemetry.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300 text-[11px]">
                <Bot className="w-3.5 h-3.5" />
                🤖 SerpApi MCP Stream
              </div>
              <p className="text-[11px] text-foreground-secondary font-sans leading-relaxed">
                Connects via official <code className="text-purple-700 dark:text-purple-300 text-[10px]">mcp.serpapi.com</code> tool gateway. Lightweight stream <strong>cuts LLM token overhead by ~60%</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Phase 2 Radar & Ungated Dork Inspector */}
      {showConfig && (
        <div className="p-4 rounded-xl bg-surface border border-purple-500/40 shadow-xl backdrop-blur-md space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-200">
                  Dork Strategy &amp; Recon Hunter Config
                </h4>
              </div>
              <p className="text-[11px] text-foreground-secondary mt-0.5">
                Inspect, toggle, and customize live SerpApi dork signatures. Zero black-box gatekeeping.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-1 rounded">
                Active Signatures: {Object.values(getEnabledVectors()).filter(Boolean).length} / 6
              </div>
              <span className="text-[10px] text-foreground-muted hidden sm:inline">
                (Unchecked = strictly bypassed, 0 queries dispatched)
              </span>
            </div>
          </div>

          {/* Vector Toggle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {/* Cloud Storage */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-elevated border border-border hover:border-border-strong cursor-pointer transition select-none shadow-sm">
              <input
                type="checkbox"
                checked={vectorCloud}
                onChange={(e) => setVectorCloud(e.target.checked)}
                className="mt-0.5 rounded bg-surface border-border text-sky-500 focus:ring-sky-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Cloud className="w-3.5 h-3.5 text-sky-500" />
                  <span>Multi-Cloud Bucket Hunter</span>
                </div>
                <p className="text-[10px] font-mono text-foreground-muted">
                  AWS S3, Azure Blob, GCS, DO Spaces
                </p>
              </div>
            </label>

            {/* GitHub Leaks */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-elevated border border-border hover:border-border-strong cursor-pointer transition select-none shadow-sm">
              <input
                type="checkbox"
                checked={vectorGithub}
                onChange={(e) => setVectorGithub(e.target.checked)}
                className="mt-0.5 rounded bg-surface border-border text-red-500 focus:ring-red-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Github className="w-3.5 h-3.5 text-red-500" />
                  <span>GitHub Secret &amp; Key Leaks</span>
                </div>
                <p className="text-[10px] font-mono text-foreground-muted">
                  .env, RSA keys, secrets.json, Gists
                </p>
              </div>
            </label>

            {/* YouTube Radar */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-elevated border border-border hover:border-border-strong cursor-pointer transition select-none shadow-sm">
              <input
                type="checkbox"
                checked={vectorYoutube}
                onChange={(e) => setVectorYoutube(e.target.checked)}
                className="mt-0.5 rounded bg-surface border-border text-rose-500 focus:ring-rose-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Youtube className="w-3.5 h-3.5 text-rose-500" />
                  <span>YouTube Exploit Radar</span>
                </div>
                <p className="text-[10px] font-mono text-foreground-muted">
                  Researcher PoC videos &amp; bug bounties
                </p>
              </div>
            </label>

            {/* Google Play */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-elevated border border-border hover:border-border-strong cursor-pointer transition select-none shadow-sm">
              <input
                type="checkbox"
                checked={vectorPlay}
                onChange={(e) => setVectorPlay(e.target.checked)}
                className="mt-0.5 rounded bg-surface border-border text-emerald-500 focus:ring-emerald-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Google Play Mobile Perimeter</span>
                </div>
                <p className="text-[10px] font-mono text-foreground-muted">
                  Client Android packages &amp; ratings
                </p>
              </div>
            </label>

            {/* Google News */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-elevated border border-border hover:border-border-strong cursor-pointer transition select-none shadow-sm">
              <input
                type="checkbox"
                checked={vectorNews}
                onChange={(e) => setVectorNews(e.target.checked)}
                className="mt-0.5 rounded bg-surface border-border text-amber-500 focus:ring-amber-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Newspaper className="w-3.5 h-3.5 text-amber-500" />
                  <span>Threat Intelligence News</span>
                </div>
                <p className="text-[10px] font-mono text-foreground-muted">
                  Breach disclosures &amp; security bulletins
                </p>
              </div>
            </label>

            {/* External Footprint */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-elevated border border-border hover:border-border-strong cursor-pointer transition select-none shadow-sm">
              <input
                type="checkbox"
                checked={vectorFootprint}
                onChange={(e) => setVectorFootprint(e.target.checked)}
                className="mt-0.5 rounded bg-surface border-border text-cyan-500 focus:ring-cyan-400"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Globe2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>External Directory Footprint</span>
                </div>
                <p className="text-[10px] font-mono text-foreground-muted">
                  Tool catalogs, mentions &amp; marketplaces
                </p>
              </div>
            </label>
          </div>

          {/* Ungated Custom Dork Injector */}
          <div className="pt-2 border-t border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-500" />
                <span>Inject Custom SerpApi Threat-Hunting Dork (Ungated)</span>
              </label>
              <span className="text-[10px] text-foreground-muted font-mono">
                Variables: <code className="text-purple-600 dark:text-purple-300 font-bold">&#123;target&#125;</code>,{" "}
                <code className="text-purple-600 dark:text-purple-300 font-bold">&#123;brand&#125;</code>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customDorkInput}
                onChange={(e) => setCustomDorkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomDork(e))}
                placeholder='e.g. site:{target} inurl:grafana  OR  site:gitlab.com "{brand}" filename:.env'
                className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-foreground-muted text-xs font-mono focus:outline-none focus:border-purple-500 shadow-sm"
              />
              <button
                type="button"
                onClick={handleAddCustomDork}
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Dork</span>
              </button>
            </div>

            {/* Render Active Custom Dorks */}
            {customDorks.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] font-mono text-foreground-muted">Custom Queries:</span>
                {customDorks.map((dork) => (
                  <span
                    key={dork}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/40 text-purple-700 dark:text-purple-200 text-xs font-mono shadow-sm"
                  >
                    <span>{dork}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomDork(dork)}
                      className="text-purple-500 hover:text-purple-700 dark:hover:text-white ml-1 cursor-pointer"
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
