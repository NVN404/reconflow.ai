"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, GitMerge, ShieldCheck, Map, Terminal, FileCheck } from "lucide-react";

export const HowItWorksSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      title: "Discover",
      short: "Find the external footprint",
      icon: Search,
      desc: "Queries SerpApi across Google, Bing, DuckDuckGo, YouTube, and Google Play to discover unindexed subdomains, exposed S3 buckets, public repositories, and indexed PDFs.",
      details: ["Multi-Engine SerpApi Dorking", "RFC Compliant DNS Sweeps", "Passive OSINT Extraction"],
    },
    {
      num: "02",
      title: "Correlate",
      short: "Connect assets and leaks",
      icon: GitMerge,
      desc: "Links exposed API tokens, public code repositories, third-party infrastructure, and host servers back to their parent domain roots.",
      details: ["Cross-Source Entity Resolution", "Dependency Graph Linking", "Owner & Infrastructure Mapping"],
    },
    {
      num: "03",
      title: "Triage",
      short: "Prioritize true risks",
      icon: ShieldCheck,
      desc: "Filters out false positives and noise using AI threat triage. Calculates CVSS severity metrics and assigns OWASP Top 10 and CWE classifications.",
      details: ["Noise Discarding Engine", "CVSS & OWASP Tagging", "Exploitability Verification"],
    },
    {
      num: "04",
      title: "Map",
      short: "Build attack-surface graph",
      icon: Map,
      desc: "Renders an interactive, auto-layouted Dagre topology map separating low-risk host assets from high-risk vulnerability endpoints.",
      details: ["Dual-Zone Architecture", "Interactive Dagre Graph", "Real-Time Severity Filtering"],
    },
    {
      num: "05",
      title: "Remediate",
      short: "Provide action playbooks",
      icon: Terminal,
      desc: "Generates precise defensive instructions, code snippets, and infrastructure configurations to patch discovered exposures.",
      details: ["Actionable Copy-Paste Commands", "Root Cause Analysis", "Defensive Configuration Playbooks"],
    },
    {
      num: "06",
      title: "Report",
      short: "Export executive dossier",
      icon: FileCheck,
      desc: "Produces an executive-ready security audit dossier formatted in Markdown, ready for engineering teams and CISO briefings.",
      details: ["Executive Risk Dossier", "Markdown & JSON Export", "Audit Log Trail"],
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-foreground-muted uppercase tracking-wider mb-3">
            <span>02 // Autonomous Methodology</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            From raw search telemetry to structured attack-surface remediation.
          </h2>
          <p className="mt-4 text-base text-foreground-secondary font-normal leading-relaxed">
            ReconFlow transforms passive multi-engine search intelligence into a verified, actionable security posture map in six automated stages.
          </p>
        </div>

        {/* Step Flow Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Step Selector List */}
          <div className="lg:col-span-6 space-y-3">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <motion.div
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  whileHover={{ x: 4 }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? "bg-surface-elevated border-lime/70 shadow-md text-foreground"
                      : "bg-surface border-border text-foreground-secondary hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        isActive ? "bg-lime text-background" : "bg-surface-elevated text-foreground-muted"
                      }`}>
                        {step.num}
                      </span>
                      <span className="text-sm font-semibold tracking-wide font-mono">
                        {step.title}
                      </span>
                    </div>
                    <span className="text-xs text-foreground-muted font-mono hidden sm:inline">
                      {step.short}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Active Step Detailed Card */}
          <div className="lg:col-span-6 rounded-xl bg-surface border border-border p-8 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-lime/10 border border-lime/30 text-lime flex items-center justify-center font-mono font-bold">
                    {steps[activeStep].num}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground font-mono">
                      {steps[activeStep].title}
                    </h3>
                    <p className="text-xs text-foreground-secondary font-mono">
                      {steps[activeStep].short}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-foreground-secondary leading-relaxed font-normal mb-8">
                {steps[activeStep].desc}
              </p>

              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold text-foreground-secondary uppercase tracking-wider block mb-3">
                  Stage Verification Specs
                </span>
                {steps[activeStep].details.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 text-xs font-mono text-foreground-secondary bg-surface-elevated px-3 py-2 rounded border border-border"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-foreground-muted">
              <span>Automated Execution Pipeline</span>
              <span>Stage {activeStep + 1} of 6</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
