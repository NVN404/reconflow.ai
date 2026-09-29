"use client";

import React from "react";
import { Radar, Network, ShieldCheck, FileSearch, Terminal, Download } from "lucide-react";

export const CapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      icon: Radar,
      title: "Multi-Engine External Discovery",
      desc: "Aggregates passive OSINT search intelligence across Google, Bing, DuckDuckGo, YouTube, and Google Play without triggering active IDS alarms.",
    },
    {
      icon: Network,
      title: "Attack-Surface Graph Topologies",
      desc: "Automatically computes topological DAG layouts separating low-risk infrastructure nodes from critical vulnerability endpoints.",
    },
    {
      icon: ShieldCheck,
      title: "Autonomous Threat Triage",
      desc: "Filters noise and false positives using AI classification to deliver CVSS risk scores and OWASP / CWE standard tags.",
    },
    {
      icon: FileSearch,
      title: "Verifiable Evidence Extraction",
      desc: "Extracts exact search engine proof snippets, dork operators, and HTTP response headers for immediate engineer verification.",
    },
    {
      icon: Terminal,
      title: "Defensive Patch Playbooks",
      desc: "Provides actionable remediation guidance, configuration patches (Nginx, Apache, AWS IAM), and credential rotation steps.",
    },
    {
      icon: Download,
      title: "Executive Reporting & Dossiers",
      desc: "Generates Markdown and JSON audit dossiers formatted for executive CISO debriefs and DevOps ticket creation.",
    },
  ];

  return (
    <section className="py-24 px-4 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-foreground-muted uppercase tracking-wider mb-3">
            <span>04 // Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            Engineered for precision attack-surface management.
          </h2>
          <p className="mt-4 text-base text-foreground-secondary font-normal leading-relaxed">
            Six focused capabilities designed to give security engineering teams complete clarity over their external internet footprint.
          </p>
        </div>

        {/* 6 Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl bg-surface border border-border flex flex-col justify-between hover:border-border-strong transition-all shadow-sm"
              >
                <div>
                  <div className="w-9 h-9 rounded bg-surface-elevated border border-border text-foreground-secondary flex items-center justify-center mb-5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2 font-mono">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-foreground-secondary leading-relaxed font-normal">
                    {cap.desc}
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-[10px] font-mono text-foreground-muted uppercase">
                  <span>Capability 0{idx + 1}</span>
                  <span>Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
