"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Network, ArrowRight } from "lucide-react";

export const ProblemSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const fragments = [
    { id: "domains", title: "Domains & Subdomains", desc: "Unmapped staging environments, legacy subdomains, and forgotten DNS records.", tag: "ASSET" },
    { id: "apis", title: "Exposed APIs & Schemas", desc: "Public Swagger docs, GraphQL endpoints, and unauthenticated API endpoints.", tag: "API" },
    { id: "repos", title: "Repositories & Tokens", desc: "Hardcoded API keys, environment files, and credentials leaked on GitHub.", tag: "LEAK" },
    { id: "infra", title: "Cloud & Storage", desc: "Public S3 buckets, exposed elasticsearch nodes, and misconfigured infrastructure.", tag: "INFRA" },
    { id: "docs", title: "Internal Documents", desc: "PDFs, spreadsheets, and sensitive corporate files indexed by search engines.", tag: "DOCS" },
    { id: "apps", title: "Mobile & Brand", desc: "Official and rogue APK files on Google Play, YouTube PoCs, and brand abuse.", tag: "BRAND" },
  ];

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
            Most organizations only monitor known web assets. Modern attack surfaces span dozens of unindexed endpoints, third-party cloud services, exposed developer tokens, and indexed documents. ReconFlow unifies these fragments into a single graph.
          </p>
        </div>

        {/* Visual Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Fragment List */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            {fragments.map((frag, idx) => (
              <motion.div
                key={frag.id}
                onClick={() => setActiveTab(idx)}
                whileHover={{ x: 4 }}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  activeTab === idx
                    ? "bg-[#0B0B0B] border-[#B7E36A]/70 text-zinc-100 shadow-md"
                    : "bg-[#080808] border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold tracking-wide text-zinc-100">
                    {frag.title}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    activeTab === idx ? "bg-[#B7E36A]/10 text-[#B7E36A] border border-[#B7E36A]/30" : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {frag.tag}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {frag.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Architectural Diagram */}
          <div className="lg:col-span-7 rounded-xl bg-[#080808] border border-zinc-800 p-8 flex flex-col justify-between relative overflow-hidden min-h-[420px]">
            <div className="absolute inset-0 bg-[radial-gradient(#292929_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-200 font-semibold uppercase tracking-wider">
                  Attack Surface Synthesis Engine
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                Connected Topology
              </span>
            </div>

            {/* Interactive Graph Node Flow */}
            <div className="relative z-10 my-8 py-6 flex flex-col items-center justify-center">
              <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-8">
                {fragments.slice(0, 3).map((f, idx) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded border text-center transition-all ${
                      activeTab === idx
                        ? "bg-[#B7E36A]/10 border-[#B7E36A] text-[#B7E36A]"
                        : "bg-[#0B0B0B] border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div className="text-[10px] font-mono text-zinc-500 mb-1">UNMAPPED</div>
                    <div className="text-xs font-mono font-semibold truncate">{f.title.split(" ")[0]}</div>
                  </div>
                ))}
              </div>

              {/* Central Synthesis Engine Node */}
              <div className="relative my-2 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#0B0B0B] border-2 border-[#B7E36A] flex items-center justify-center shadow-xl z-10">
                  <span className="font-mono text-xs font-bold text-[#B7E36A]">RECON</span>
                </div>
                <div className="absolute w-32 h-32 rounded-full border border-[#B7E36A]/20 animate-ping opacity-20 pointer-events-none" />
              </div>

              <div className="mt-8 text-center max-w-sm">
                <div className="text-xs font-mono text-zinc-200 font-semibold mb-1">
                  Single Unified Graph Schema
                </div>
                <div className="text-[11px] text-zinc-500">
                  Correlates passive SerpApi dorks, RFC DNS records, HTTP headers, and leaked secrets into structured graph edges.
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="relative z-10 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Active Target: {fragments[activeTab].title}</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-300 font-semibold">
                <span>View Graph Representation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
