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
    <section className="relative min-h-[92vh] flex flex-col justify-center items-center pt-28 pb-16 px-4 overflow-hidden border-b border-border bg-background transition-colors duration-200">
      {/* 1. Three.js Particle Wave Background */}
      <ParticleWave />

      {/* 2. Readability Gradient Overlays (Pure transparent white in light mode, obsidian vignette in dark mode) */}
      <div className="absolute inset-0 bg-radial from-white/0 via-white/50 to-slate-50 dark:from-transparent dark:via-[#050505]/40 dark:to-[#050505] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-50 to-transparent dark:from-[#050505] dark:to-transparent pointer-events-none" />

      {/* 3. Hero Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Technical Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-xs font-mono text-foreground-secondary mb-8 shadow-sm backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
          <span className="text-foreground font-semibold">Autonomous Attack-Surface Intelligence</span>
          <span className="text-foreground-muted">|</span>
          <span className="text-foreground-secondary">SerpApi Multi-Engine Recon</span>
        </motion.div>

        {/* Headline with word animation */}
        <AnimatedText
          text="Your external surface, made visible."
          highlightWord="visible."
          highlightClassName="text-lime font-serif italic"
          className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-6 justify-center leading-[1.1]"
        />

        {/* Concise Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-foreground-secondary max-w-2xl font-normal leading-relaxed mb-10"
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
            <div className="absolute left-4 text-foreground-muted pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputDomain}
              onChange={(e) => setInputDomain(e.target.value)}
              placeholder="Enter domain (e.g. vulnweb.com)"
              disabled={isScanning}
              className="w-full pl-11 pr-36 py-3.5 rounded-lg bg-surface-elevated border border-border focus:border-lime focus:ring-1 focus:ring-lime text-sm font-mono text-foreground placeholder:text-foreground-muted outline-none transition-all shadow-md backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={isScanning}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-md bg-foreground hover:opacity-90 text-background font-mono font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isScanning ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-background border-t-transparent animate-spin" />
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
          className="flex flex-wrap items-center justify-center gap-2 text-xs text-foreground-muted font-mono"
        >
          <span>Try target:</span>
          {["vulnweb.com", "acunetix.com"].map((target) => (
            <button
              key={target}
              onClick={() => handleChipClick(target)}
              className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface text-foreground-secondary hover:text-foreground border border-border hover:border-border-strong transition-all cursor-pointer shadow-sm"
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
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-16 mt-12 border-t border-border w-full max-w-3xl text-left font-mono"
        >
          <div>
            <div className="text-xl font-bold text-foreground">5 Search Engines</div>
            <div className="text-xs text-foreground-muted mt-1 font-sans">Multi-source SerpApi passive sweeps</div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">Graph-First</div>
            <div className="text-xs text-foreground-muted mt-1 font-sans">Dagre auto-layouted topology</div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">CVSS &amp; OWASP</div>
            <div className="text-xs text-foreground-muted mt-1 font-sans">AI-assisted vulnerability triage</div>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600 dark:text-[#10b981] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#10b981]" />
              <span>Non-Intrusive</span>
            </div>
            <div className="text-xs text-foreground-muted mt-1 font-sans">Passive intel + light telemetry</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
