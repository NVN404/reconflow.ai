"use client";

import React, { useState } from "react";
import { ArrowRight, Terminal } from "lucide-react";

interface FinalCTASectionProps {
  onScanTarget: (domain: string) => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onScanTarget }) => {
  const [domain, setDomain] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    onScanTarget(domain.trim());
  };

  return (
    <section className="py-28 px-4 bg-background border-b border-border relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border text-xs font-mono text-foreground-secondary mb-6">
          <Terminal className="w-3.5 h-3.5" />
          <span>Instant External Surface Audit</span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6 font-sans">
          Know your surface.
        </h2>

        <p className="text-base sm:text-lg text-foreground-secondary font-normal max-w-xl mb-10 leading-relaxed">
          Uncover exposed assets, leaked credentials, and unindexed subdomains in seconds.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md flex items-center gap-2 font-mono">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter target domain (e.g. vulnweb.com)"
            className="flex-1 px-4 py-3 rounded-lg bg-surface-elevated border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-lime text-xs shadow-inner"

          />
          <button
            type="submit"
            className="px-5 py-3 rounded-lg bg-foreground hover:opacity-90 text-background font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>Start Recon</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </section>
  );
};
