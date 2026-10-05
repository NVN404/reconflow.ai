"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ArrowRight, Play, Sparkles } from "lucide-react";

interface FragmentTelemetry {
  id: string;
  title: string;
  tag: string;
  desc: string;
  engine: string;
  dork: string;
  latency: string;
  findingsCount: number;
  sampleLogs: Array<{
    type: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
    asset: string;
    details: string;
    cvss?: string;
  }>;
}

export const ProblemSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  const fragments: FragmentTelemetry[] = [
    {
      id: "domains",
      title: "Domains & Subdomains",
      tag: "ASSET",
      desc: "Unmapped staging environments, legacy subdomains, and forgotten DNS records.",
      engine: "SerpApi Multi-Engine (Google + Bing + DDG)",
      dork: 'site:*.target.com -www.target.com',
      latency: "412ms",
      findingsCount: 4,
      sampleLogs: [
        { type: "HIGH", asset: "https://staging-auth.target.com", details: "Legacy OAuth 1.0 redirectURI exposed", cvss: "7.4" },
        { type: "MEDIUM", asset: "https://vpn-old.internal.target.com", details: "Exposed Pulse Secure gateway prompt", cvss: "5.8" },
        { type: "INFO", asset: "https://cdn-assets.target.com", details: "Unrestricted CloudFront distribution CNAME" },
        { type: "INFO", asset: "https://dev-api.target.com", details: "FastAPI docs /redoc exposed on public endpoint" }
      ],
    },
    {
      id: "apis",
      title: "Exposed APIs & Schemas",
      tag: "API",
      desc: "Public Swagger docs, GraphQL endpoints, and unauthenticated API endpoints.",
      engine: "SerpApi Bing & Google Intelligence",
      dork: 'site:target.com (inurl:swagger OR inurl:graphiql OR inurl:api/v1 OR inurl:graphql)',
      latency: "380ms",
      findingsCount: 3,
      sampleLogs: [
        { type: "CRITICAL", asset: "https://api.target.com/graphql/console", details: "GraphQL Introspection enabled without auth token", cvss: "9.1" },
        { type: "HIGH", asset: "https://admin.target.com/v1/swagger.json", details: "Internal enterprise microservice routes disclosed", cvss: "7.5" },
        { type: "MEDIUM", asset: "https://target.com/api/v2/metrics", details: "Prometheus exporter scraping endpoint accessible", cvss: "5.3" }
      ],
    },
    {
      id: "repos",
      title: "Repositories & Tokens",
      tag: "LEAK",
      desc: "Hardcoded API keys, environment files, and credentials leaked on GitHub.",
      engine: "SerpApi Google Intelligence",
      dork: 'site:github.com "target.com" ("AKIA" OR "sk_live_" OR "ghp_")',
      latency: "520ms",
      findingsCount: 3,
      sampleLogs: [
        { type: "CRITICAL", asset: "github.com/org-archive/backend-service/.env", details: "Hardcoded AWS_SECRET_ACCESS_KEY exposed", cvss: "9.8" },
        { type: "HIGH", asset: "github.com/contractor-dev/deploy-script.sh", details: "Stripe Live API Key (sk_live_...) found in commit", cvss: "8.6" },
        { type: "MEDIUM", asset: "gist.github.com/developer/target-db-backup.sql", details: "MySQL dump with hashed customer credentials", cvss: "6.9" }
      ],
    },
    {
      id: "infra",
      title: "Cloud & Storage",
      tag: "INFRA",
      desc: "Public S3 buckets, exposed elasticsearch nodes, and misconfigured infrastructure.",
      engine: "SerpApi DuckDuckGo & Google Passive",
      dork: 'site:s3.amazonaws.com "target.com" OR site:blob.core.windows.net "target.com"',
      latency: "290ms",
      findingsCount: 2,
      sampleLogs: [
        { type: "CRITICAL", asset: "https://target-prod-backups.s3.amazonaws.com", details: "Public Read ACL on daily RDS snapshots", cvss: "9.4" },
        { type: "HIGH", asset: "https://target-customer-docs.blob.core.windows.net", details: "Anonymous Blob access permitted on KYC uploads", cvss: "8.2" }
      ],
    },
    {
      id: "docs",
      title: "Internal Documents",
      tag: "DOCS",
      desc: "PDFs, spreadsheets, and sensitive corporate files indexed by search engines.",
      engine: "SerpApi Google & Yahoo Engines",
      dork: 'site:target.com (filetype:pdf OR filetype:xlsx) ("CONFIDENTIAL" OR "INTERNAL ONLY")',
      latency: "340ms",
      findingsCount: 3,
      sampleLogs: [
        { type: "HIGH", asset: "https://target.com/files/Q4_Financial_Audit_INTERNAL.xlsx", details: "Internal revenue breakdown & employee compensation", cvss: "7.1" },
        { type: "MEDIUM", asset: "https://target.com/docs/network-architecture-v2.pdf", details: "VPC CIDR blocks and bastion host IP ranges", cvss: "5.5" },
        { type: "MEDIUM", asset: "https://target.com/reports/board-minutes-2025.pdf", details: "Unredacted M&A disclosure and vendor lists", cvss: "5.0" }
      ],
    },
    {
      id: "apps",
      title: "Mobile & Brand",
      tag: "BRAND",
      desc: "Official and rogue APK files on Google Play, YouTube PoCs, and brand abuse.",
      engine: "SerpApi Google Play & YouTube APIs",
      dork: 'engine:google_play q="target" | engine:youtube q="target.com poc exploit"',
      latency: "610ms",
      findingsCount: 2,
      sampleLogs: [
        { type: "HIGH", asset: "Google Play Store: com.target.staging.debug", details: "Debug build signed with test certificate uploaded to public store", cvss: "7.7" },
        { type: "MEDIUM", asset: "YouTube: 'target.com 0-day account takeover PoC'", details: "Public video disclosure of unpatched IDOR vulnerability", cvss: "6.8" }
      ],
    },
  ];

  // Auto-cycle through tabs if autoplay is on
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % fragments.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, fragments.length]);

  const current = fragments[activeTab];

  const handleSelectTab = (idx: number) => {
    setActiveTab(idx);
    setIsAutoPlaying(false);
  };

  const scrollToGraph = () => {
    const el = document.getElementById("graph-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="problem" className="py-24 px-4 bg-[#050505] border-b border-zinc-800/60 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">
            <span>01 // The Perimeter Problem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100 leading-tight">
            The external surface is fragmented, dynamic, and partially invisible.
          </h2>
          <p className="mt-4 text-base text-zinc-400 font-normal leading-relaxed">
            Most organizations only monitor known web assets. Modern attack surfaces span unindexed endpoints, third-party cloud buckets, leaked developer secrets, and exposed documents. ReconFlow orchestrates SerpApi across multiple engines to map every layer.
          </p>
        </div>

        {/* Visual Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Fragment List */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-2.5">
            {fragments.map((frag, idx) => {
              const isSelected = activeTab === idx;
              return (
                <motion.div
                  key={frag.id}
                  onClick={() => handleSelectTab(idx)}
                  whileHover={{ x: 4 }}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0E0E0E] border-[#B7E36A]/80 text-zinc-100 shadow-lg shadow-[#B7E36A]/5"
                      : "bg-[#080808] border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#B7E36A] animate-pulse" : "bg-zinc-600"}`} />
                      <span className="text-xs font-mono font-semibold tracking-wide text-zinc-100">
                        {frag.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isSelected
                          ? "bg-[#B7E36A]/15 text-[#B7E36A] border border-[#B7E36A]/40"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {frag.tag}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-normal pl-3.5">
                    {frag.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column: Live Interactive OSINT Recon Terminal */}
          <div className="lg:col-span-7 rounded-xl bg-[#080808] border border-zinc-800 flex flex-col justify-between relative overflow-hidden min-h-[460px] shadow-2xl">
            {/* Terminal Header Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 bg-[#0C0C0C]/90">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="h-3 w-px bg-zinc-700 mx-1" />
                <Terminal className="w-3.5 h-3.5 text-[#B7E36A]" />
                <span className="text-xs font-mono text-zinc-200 font-semibold tracking-wide">
                  serpapi-recon-worker // <span className="text-[#B7E36A]">{current.tag.toLowerCase()}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1 transition-all cursor-pointer ${
                    isAutoPlaying
                      ? "bg-[#B7E36A]/10 text-[#B7E36A] border border-[#B7E36A]/30"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200"
                  }`}
                  title={isAutoPlaying ? "Pause auto-rotation" : "Auto-rotate categories"}
                >
                  <Play className={`w-2.5 h-2.5 ${isAutoPlaying ? "animate-spin" : ""}`} />
                  <span>{isAutoPlaying ? "Auto Demo" : "Paused"}</span>
                </button>
                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                  {current.latency}
                </span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-5 font-mono text-xs flex-1 flex flex-col justify-between overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Command Line */}
                  <div className="p-3 rounded-lg bg-[#040404] border border-zinc-800 text-zinc-300">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5">
                      <span className="text-zinc-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#B7E36A]" />
                        {current.engine}
                      </span>
                      <span>STATUS: 200 OK</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#B7E36A] font-bold select-none">&gt;</span>
                      <span className="text-zinc-200 font-mono text-xs break-all">
                        {current.dork}
                      </span>
                    </div>
                  </div>

                  {/* Discovered Findings List */}
                  <div>
                    <div className="flex items-center justify-between mb-2 text-[11px] text-zinc-400">
                      <span className="font-semibold uppercase tracking-wider text-zinc-300">
                        Synthesized Telemetry ({current.sampleLogs.length} nodes)
                      </span>
                      <span className="text-zinc-500">Dual-Zone Layout: Verified</span>
                    </div>

                    <div className="space-y-2">
                      {current.sampleLogs.map((log, lIdx) => (
                        <motion.div
                          key={lIdx}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: lIdx * 0.08 }}
                          className="p-2.5 rounded bg-[#0D0D0D] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                  log.type === "CRITICAL"
                                    ? "bg-rose-950/80 text-rose-300 border border-rose-800/60"
                                    : log.type === "HIGH"
                                    ? "bg-amber-950/80 text-amber-300 border border-amber-800/60"
                                    : log.type === "MEDIUM"
                                    ? "bg-yellow-950/80 text-yellow-300 border border-yellow-800/60"
                                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                }`}
                              >
                                {log.type}
                              </span>
                              <span className="text-zinc-200 font-semibold truncate text-[11px]">
                                {log.asset}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-sans pl-1 truncate">
                              {log.details}
                            </p>
                          </div>

                          {log.cvss && (
                            <div className="flex-shrink-0 text-right">
                              <span className="text-[10px] font-mono text-zinc-400">
                                CVSS <span className="text-zinc-200 font-bold">{log.cvss}</span>
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Terminal Footer Indicator */}
              <div className="pt-4 mt-4 border-t border-zinc-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] text-zinc-300">
                    Live Engine Active: <span className="text-[#B7E36A] font-semibold">{current.title}</span>
                  </span>
                </div>

                <button
                  onClick={scrollToGraph}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-200 hover:text-white bg-[#121212] hover:bg-[#181818] border border-zinc-700/80 px-3 py-1.5 rounded transition-all cursor-pointer shadow-sm"
                >
                  <span>Explore In Attack Graph</span>
                  <ArrowRight className="w-3 h-3 text-[#B7E36A]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
