"use client";

import React, { useState } from "react";
import { ShieldAlert, Terminal, ArrowRight, Check, Copy } from "lucide-react";

export const RemediationSection: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sampleFinding = {
    title: "Exposed Environment Configuration File",
    target: "https://staging.reconflow.render.com/.env",
    severity: "CRITICAL",

    cvss: "9.1",
    cwe: "CWE-552: Files or Directories Accessible to External Parties",
    owasp: "A05:2021 Security Misconfiguration",
    evidence: "DB_PASSWORD=production_secret_key_88192\nAWS_SECRET_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE\nJWT_SECRET=super_secret_token_signature",
    remediation: "Immediately revoke exposed AWS API keys and database credentials. Restrict web server access to dotfiles by updating nginx/apache configuration.",
    codePlaybook: `# Nginx: Block access to hidden dotfiles\nlocation ~ /\\. {\n    deny all;\n    return 404;\n}`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleFinding.codePlaybook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-24 px-4 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-foreground-muted uppercase tracking-wider mb-3">
            <span>03 // Actionable Triage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            From exposure detection to copy-paste remediation.
          </h2>
          <p className="mt-4 text-base text-foreground-secondary font-normal leading-relaxed">
            Discovery without context creates noise. ReconFlow extracts exact proof snippets, calculates CVSS impact, and provides engineer-ready patch directives.
          </p>
        </div>

        {/* Visual Story Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch font-mono">
          {/* Step 1: Finding & Evidence */}
          <div className="lg:col-span-6 rounded-xl bg-surface border border-border p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>STEP 01: DISCOVERY & EVIDENCE</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/30 text-rose-300 border border-rose-800/60">
                  CRITICAL (CVSS {sampleFinding.cvss})
                </span>
              </div>

              <h4 className="text-sm font-bold text-foreground mb-1">
                {sampleFinding.title}
              </h4>
              <p className="text-xs text-foreground-muted truncate mb-4">
                {sampleFinding.target}
              </p>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-foreground-muted uppercase block mb-1">
                    Industry Standards Classification
                  </span>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-lime">
                      {sampleFinding.owasp}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground-secondary">
                      {sampleFinding.cwe}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-foreground-muted uppercase block mb-1">
                    Extracted Proof Evidence
                  </span>
                  <div className="p-3 rounded bg-surface-elevated border border-border text-xs text-rose-300 font-mono leading-relaxed whitespace-pre-wrap">
                    {sampleFinding.evidence}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
              <span>Verified Passive Extraction</span>
              <ArrowRight className="w-4 h-4 text-foreground-muted" />
            </div>
          </div>

          {/* Step 2: Defensive Playbook */}
          <div className="lg:col-span-6 rounded-xl bg-surface-elevated border border-border p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>STEP 02: DEFENSIVE PLAYBOOK</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-800/60">
                  ACTION DIRECTIVE
                </span>
              </div>

              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Executive Remediation Guidance
              </h4>
              <p className="text-xs text-foreground-secondary leading-relaxed mb-4 font-sans">
                {sampleFinding.remediation}
              </p>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-foreground-muted uppercase">
                    Defensive Nginx Patch Configuration
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-[10px] text-emerald-400 hover:opacity-80 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy Configuration"}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded bg-surface border border-border text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto">
                  {sampleFinding.codePlaybook}
                </pre>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
              <span>Ready for DevOps Deployment</span>
              <span className="text-emerald-400 font-bold">100% Actionable</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
