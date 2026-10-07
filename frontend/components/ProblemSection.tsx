"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      id: "cloud",
      title: "Multi-Cloud Storage Buckets",
      tag: "CLOUD",
      desc: "Misconfigured public S3 buckets, Azure Blobs, and Google Cloud Storage buckets.",
      engine: "SerpApi Multi-Cloud Hunter",
      dork: 'site:s3.amazonaws.com target OR site:blob.core.windows.net target',
      latency: "445ms",
      findingsCount: 3,
      sampleLogs: [
        { type: "CRITICAL", asset: "https://target-backups.s3.amazonaws.com", details: "Public database dumps and daily archive tarballs", cvss: "9.8" },
        { type: "HIGH", asset: "https://target-logs.blob.core.windows.net", details: "Application trace logs disclosing internal IP ranges", cvss: "7.1" },
        { type: "INFO", asset: "https://target-static.storage.googleapis.com", details: "Public marketing assets bucket without write access" }
      ],
    },
    {
      id: "secrets",
      title: "Leaked Developer Secrets",
      tag: "SECRETS",
      desc: "Accidental credential commits in GitHub gists, paste sites, and public repositories.",
      engine: "SerpApi Code & Repository Matrix",
      dork: 'site:github.com "target.com" filename:.env OR filename:credentials.json',
      latency: "510ms",
      findingsCount: 3,
      sampleLogs: [
        { type: "CRITICAL", asset: "https://github.com/target-dev/repo/.env", details: "Production JWT secret and Stripe live secret key", cvss: "9.9" },
        { type: "HIGH", asset: "https://gist.github.com/dev/db_creds.py", details: "Hardcoded Postgres connection URI with plaintext password", cvss: "8.5" },
        { type: "MEDIUM", asset: "https://pastebin.com/raw/xK89s1", details: "Internal Slack webhook URL disclosed in debugging dump", cvss: "6.2" }
      ],
    },
    {
      id: "docs",
      title: "Confidential Document Leaks",
      tag: "DOCS",
      desc: "Indexed PDFs, internal policy handbooks, and architecture whitepapers.",
      engine: "SerpApi Google PDF & Document Scanner",
      dork: 'site:target.com filetype:pdf (confidential OR internal OR "not for distribution")',
      latency: "340ms",
      findingsCount: 3,
      sampleLogs: [
        { type: "HIGH", asset: "https://target.com/assets/docs/soc2_type2_audit.pdf", details: "Unredacted third-party security audit report", cvss: "7.2" },
        { type: "MEDIUM", asset: "https://target.com/files/network_topology_2025.pdf", details: "Internal VPC network diagrams and CIDR blocks", cvss: "6.5" },
        { type: "INFO", asset: "https://target.com/careers/employee_handbook.pdf", details: "Standard HR employee onboarding policies" }
      ],
    },
  ];

  const current = fragments[activeTab];

  // Auto-rotate through fragments unless user interacts
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % fragments.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, fragments.length]);

  const handleSelectTab = (idx: number) => {
    setActiveTab(idx);
    setIsAutoPlaying(false);
  };

  const navigateToRecon = () => {
    router.push("/recon");
  };

  return (
    <section id="problem" className="py-24 px-4 bg-background border-b border-border relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-foreground-muted uppercase tracking-wider mb-3">
            <span>01 // The Perimeter Problem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            The external surface is fragmented, dynamic, and partially invisible.
          </h2>
          <p className="mt-4 text-base text-foreground-secondary font-normal leading-relaxed">
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
                      ? "bg-surface-elevated border-lime text-foreground shadow-md"
                      : "bg-surface border-border text-foreground-secondary hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-lime animate-pulse" : "bg-foreground-muted"}`} />
                      <span className="text-xs font-mono font-semibold tracking-wide text-foreground">
                        {frag.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isSelected
                          ? "bg-lime/15 text-lime border border-lime/40"
                          : "bg-surface-elevated text-foreground-muted border border-border"
                      }`}
                    >
                      {frag.tag}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-secondary leading-relaxed font-normal pl-3.5">
                    {frag.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column: Live Interactive OSINT Recon Terminal */}
          <div className="lg:col-span-7 rounded-xl bg-surface border border-border flex flex-col justify-between relative overflow-hidden min-h-[460px] shadow-xl">
            {/* Terminal Header Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-border px-4 py-3 bg-surface-elevated">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="h-3 w-px bg-border mx-1" />
                <Terminal className="w-3.5 h-3.5 text-lime" />
                <span className="text-xs font-mono text-foreground font-semibold tracking-wide">
                  serpapi-recon-worker // <span className="text-lime">{current.tag.toLowerCase()}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1 transition-all cursor-pointer ${
                    isAutoPlaying
                      ? "bg-lime/10 text-lime border border-lime/30"
                      : "bg-surface-elevated text-foreground-secondary border border-border hover:text-foreground"
                  }`}
                  title={isAutoPlaying ? "Pause auto-rotation" : "Auto-rotate categories"}
                >
                  <Play className={`w-2.5 h-2.5 ${isAutoPlaying ? "animate-spin" : ""}`} />
                  <span>{isAutoPlaying ? "Auto Demo" : "Paused"}</span>
                </button>
                <span className="text-[11px] font-mono text-foreground-muted hidden sm:inline">
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
                  <div className="p-3 rounded-lg bg-surface-elevated border border-border text-foreground">
                    <div className="flex items-center justify-between text-[10px] text-foreground-muted mb-1.5">
                      <span className="text-foreground-secondary font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-lime" />
                        {current.engine}
                      </span>
                      <span>STATUS: 200 OK</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lime font-bold select-none">&gt;</span>
                      <span className="text-foreground font-mono text-xs break-all">
                        {current.dork}
                      </span>
                    </div>
                  </div>

                  {/* Discovered Findings List */}
                  <div>
                    <div className="flex items-center justify-between mb-2 text-[11px] text-foreground-secondary">
                      <span className="font-semibold uppercase tracking-wider text-foreground">
                        Synthesized Telemetry ({current.sampleLogs.length} nodes)
                      </span>
                      <span className="text-foreground-muted">Dual-Zone Layout: Verified</span>
                    </div>

                    <div className="space-y-2">
                      {current.sampleLogs.map((log, lIdx) => (
                        <motion.div
                          key={lIdx}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: lIdx * 0.08 }}
                          className="p-2.5 rounded bg-surface border border-border hover:border-border-strong transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
                        >
                          <div className="space-y-0.5 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                  log.type === "CRITICAL"
                                    ? "bg-rose-950/20 text-rose-500 border border-rose-800/40"
                                    : log.type === "HIGH"
                                    ? "bg-amber-950/20 text-amber-500 border border-amber-800/40"
                                    : log.type === "MEDIUM"
                                    ? "bg-yellow-950/20 text-yellow-500 border border-yellow-800/40"
                                    : "bg-surface-elevated text-foreground-muted border border-border"
                                }`}
                              >
                                {log.type}
                              </span>
                              <span className="text-foreground font-semibold truncate text-[11px]">
                                {log.asset}
                              </span>
                            </div>
                            <p className="text-[11px] text-foreground-secondary font-sans pl-1 truncate">
                              {log.details}
                            </p>
                          </div>

                          {log.cvss && (
                            <div className="flex-shrink-0 text-right">
                              <span className="text-[10px] font-mono text-foreground-muted">
                                CVSS <span className="text-foreground font-bold">{log.cvss}</span>
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
              <div className="pt-4 mt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-foreground-secondary">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] text-foreground-secondary">
                    Live Engine Active: <span className="text-lime font-semibold">{current.title}</span>
                  </span>
                </div>

                <button
                  onClick={navigateToRecon}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground hover:opacity-90 bg-surface-elevated hover:bg-surface border border-border px-3 py-1.5 rounded transition-all cursor-pointer shadow-sm"
                >
                  <span>Explore In Attack Graph</span>
                  <ArrowRight className="w-3 h-3 text-lime" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
