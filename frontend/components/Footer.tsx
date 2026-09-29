"use client";

import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-background py-12 px-4 border-t border-border font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground tracking-tight">
              RECONFLOW<span className="text-lime">.AI</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground-secondary">
              Track 01: AI Agents
            </span>
          </div>
          <p className="text-foreground-muted text-xs font-sans leading-relaxed">
            Autonomous external attack-surface discovery and threat intelligence powered by SerpApi MCP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-8 text-foreground-secondary">
          <a href="#problem" className="hover:text-foreground transition-colors">The Problem</a>
          <a href="#graph-section" className="hover:text-foreground transition-colors">Attack Surface Graph</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-[11px] text-foreground-muted gap-4">
        <div>
          &copy; {new Date().getFullYear()} ReconFlow.AI. Engineered for SerpApi India Hackathon 2026.
        </div>
        <div className="flex items-center gap-4">
          <span>Non-Intrusive Hybrid EASM</span>
          <span>|</span>
          <span>100% SerpApi Multi-Engine Sweeps</span>
        </div>
      </div>
    </footer>
  );
};
