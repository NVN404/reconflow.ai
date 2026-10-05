"use client";

import React, { useState } from "react";
import { ParticleWave } from "@/components/ui/particle-wave";
import { AnimatedText } from "./AnimatedText";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface HeroSectionProps {
  onScanTarget: (domain: string) => void;
  isScanning: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScanTarget, isScanning }) => {
  const [inputDomain, setInputDomain] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputDomain.trim()) return;
    onScanTarget(inputDomain.trim());
  };

  const handleChipClick = (domain: string) => {
    setInputDomain(domain);
    onScanTarget(domain);
  };

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center items-center pt-28 pb-16 px-4 overflow-hidden border-b border-zinc-800/80 bg-[#050505]">
      {/* 1. Three.js Particle Wave Background */}
      <ParticleWave />

      {/* 2. Readability Gradient Overlays */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#050505]/40 to-[#050505] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />

      {/* 3. Hero Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Technical Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111111]/90 border border-zinc-800 text-xs font-mono text-zinc-400 mb-8 backdrop-blur-sm shadow-md"
        >
          <span className="w-2 h-2 rounded-full bg-[#B7E36A] animate-pulse" />
          <span>Autonomous Attack-Surface Intelligence</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">SerpApi Multi-Engine Recon</span>
        </motion.div>

        {/* Headline with word animation */}
        <AnimatedText
          text="Your external surface, made visible."
          highlightWord="visible."
          highlightClassName="text-[#B7E36A] font-serif italic"
          className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-100 mb-6 justify-center leading-[1.1]"
        />

        {/* Concise Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal leading-relaxed mb-10"
        >
          ReconFlow continuously discovers an organization&apos;s fragmented internet footprint—assets, APIs, exposed documents, and threat vectors—connecting them into a unified, actionable intelligence graph.
        </motion.p>

        {/* Hero Interactive Input / Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-xl mb-6"
        >
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="absolute left-4 text-zinc-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputDomain}
              onChange={(e) => setInputDomain(e.target.value)}
              placeholder="Enter domain (e.g. reconflow.render.com, reconflow.ai)"
              disabled={isScanning}
              className="w-full pl-11 pr-36 py-3.5 rounded-lg bg-[#111111]/90 border border-zinc-800 focus:border-[#B7E36A]/80 focus:ring-1 focus:ring-[#B7E36A]/50 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 outline-none transition-all shadow-lg backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={isScanning}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-md bg-zinc-100 hover:bg-white text-[#050505] font-mono font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isScanning ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-[#050505] border-t-transparent animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span>Audit Surface</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Quick Sample Domain Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500 font-mono"
        >
          <span>Try target:</span>
          {["reconflow.render.com", "reconflow.ai"].map((target) => (
            <button
              key={target}
              onClick={() => handleChipClick(target)}
              className="px-2.5 py-1 rounded bg-[#111111] hover:bg-[#0B0B0B] text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
            >
              {target}
            </button>
          ))}
        </motion.div>

        {/* Capability Metrics Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-16 mt-12 border-t border-zinc-800/60 w-full max-w-3xl text-left font-mono"
        >
          <div>
            <div className="text-xl font-bold text-zinc-100">5 Search Engines</div>
            <div className="text-xs text-zinc-500 mt-1 font-sans">Multi-source SerpApi passive sweeps</div>
          </div>
          <div>
            <div className="text-xl font-bold text-zinc-100">Graph-First</div>
            <div className="text-xs text-zinc-500 mt-1 font-sans">Dagre auto-layouted topology</div>
          </div>
          <div>
            <div className="text-xl font-bold text-zinc-100">CVSS & OWASP</div>
            <div className="text-xs text-zinc-500 mt-1 font-sans">AI-assisted vulnerability triage</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#10b981] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#10b981]" />
              <span>Non-Intrusive</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1 font-sans">Passive intel + light telemetry</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
