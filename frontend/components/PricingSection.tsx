"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Zap, Shield, Sparkles, Building2, Server } from "lucide-react";
import { motion } from "framer-motion";

interface PricingSectionProps {
  onUpgradeClick?: (planName: string, price: string, amountCents: number) => void;
  isProMember?: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onUpgradeClick, isProMember }) => {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Community",
      badge: "FIRST SCAN FREE",
      priceMonthly: "$0",
      priceAnnual: "$0",
      amountMonthly: 0,
      amountAnnual: 0,
      period: "1st scan free trial",
      desc: "For security researchers and developers to evaluate external attack surface exposure with a live audit.",
      serpapiQuota: "SerpApi Multi-Engine Free Evaluation",
      dailyRate: "1 Target Domain Audit (Free Trial)",
      features: [
        "1 Full Target Perimeter Scan (Free)",
        "Passive SerpApi Multi-Engine Sweeps",
        "Interactive Attack Surface Graph (Dagre)",
        "Basic Triage & Evidence Snippets",
        "Community Discord & Documentation",
      ],
      cta: "Start Free Scan",
      highlighted: false,
    },
    {
      name: "Starter",
      badge: "INDIVIDUAL",
      priceMonthly: "$39",
      priceAnnual: "$31",
      amountMonthly: 3900,
      amountAnnual: 3100,
      period: isAnnual ? "per month, billed annually" : "per month",
      desc: "For independent security analysts and bug bounty hunters needing daily attack-surface recon.",
      serpapiQuota: "1,000 SerpApi Searches / mo ($25 cost + $14 dev profit)",
      dailyRate: "3 Target Domain Audits / day (~100 scans/mo)",
      features: [
        "3 Target Domain Audits / day (~100 scans/mo)",
        "1,000 SerpApi Multi-Engine Queries / mo",
        "Passive Dork Radar (Google, Bing, DuckDuckGo)",
        "Attack Surface Graph with Interactive Dagre Layout",
        "Remediation Snippets & Risk Severity Scoring",
        "Standard Email Support",
      ],
      cta: "Subscribe to Starter",
      highlighted: false,
    },
    {
      name: "Developer",
      badge: "MOST POPULAR",
      priceMonthly: "$99",
      priceAnnual: "$79",
      amountMonthly: 9900,
      amountAnnual: 7900,
      period: isAnnual ? "per month, billed annually" : "per month",
      desc: "For growing security engineering teams requiring continuous multi-engine intelligence & MCP agent triage.",
      serpapiQuota: "5,000 SerpApi Searches / mo ($75 cost + $24 dev profit)",
      dailyRate: "15 Target Domain Audits / day (~450 scans/mo)",
      features: [
        "15 Target Domain Audits / day (~450 scans/mo)",
        "5,000 SerpApi Recon Queries / mo (Phase 1 & 2)",
        "Autonomous SerpApi MCP Agent & Real-Time Chat",
        "Full 6-Engine Deep Recon (GitHub, S3, Play, YouTube)",
        "Automated CVSS & OWASP Defensive Playbooks",
        "Executive Dossier Export (Markdown & JSON)",
        "Priority Support & Dedicated API Key Routing",
      ],
      cta: "Start Developer Plan",
      highlighted: true,
    },
    {
      name: "Production",
      badge: "HIGH VOLUME",
      priceMonthly: "$199",
      priceAnnual: "$159",
      amountMonthly: 19900,
      amountAnnual: 15900,
      period: isAnnual ? "per month, billed annually" : "per month",
      desc: "For security teams and high-velocity organizations requiring deep, continuous external attack monitoring.",
      serpapiQuota: "15,000 SerpApi Searches / mo ($150 cost + $49 dev profit)",
      dailyRate: "50 Target Domain Audits / day (~1,500 scans/mo)",
      features: [
        "50 Target Domain Audits / day (~1,500 scans/mo)",
        "15,000 SerpApi High-Throughput Queries / mo",
        "Dual Protocol Hybrid Engine (Direct REST + SerpApi MCP)",
        "Automated Continuous Monitoring & SIEM Webhook Feeds",
        "Custom Dork Operator Ingestion & Vector Rules",
        "SOC2 Compliance Dossier Generation",
        "24/7 SLA & Dedicated Engineering Support",
      ],
      cta: "Upgrade to Production",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-foreground-muted uppercase tracking-wider mb-3">
            <span>05 // Predictable Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            Clear, transparent pricing backed by SerpApi intelligence.
          </h2>
          <p className="mt-4 text-base text-foreground-secondary font-normal leading-relaxed">
            First scan is 100% free. Choose a daily audit tier powered by managed SerpApi multi-engine search quotas.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3 font-mono text-xs">
            <span className={!isAnnual ? "text-foreground font-bold" : "text-foreground-muted"}>
              Monthly Billing
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-surface-elevated p-1 relative transition-colors border border-border cursor-pointer"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-4 h-4 rounded-full bg-lime transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={isAnnual ? "text-foreground font-bold" : "text-foreground-muted"}>
                Annual Billing
              </span>
              <span className="px-2 py-0.5 rounded bg-lime/10 text-lime border border-lime/20 text-[10px] font-bold">
                SAVE 20%
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid (4 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto font-mono">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -4 }}
              className={`rounded-xl p-6 flex flex-col justify-between relative transition-all ${
                plan.highlighted
                  ? "bg-surface-elevated border-2 border-lime shadow-xl shadow-lime/5"
                  : "bg-surface border border-border hover:border-border-strong"
              }`}
            >
              {plan.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    plan.highlighted
                      ? "bg-lime text-background shadow-md shadow-lime/20"
                      : "bg-surface-elevated text-foreground border border-border"
                  }`}
                >
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3 mt-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {plan.name}
                  </h3>
                </div>

                <p className="text-xs text-foreground-secondary font-sans leading-relaxed mb-5 min-h-[48px]">
                  {plan.desc}
                </p>

                {/* Quota / Daily allowance callout */}
                <div className="mb-4 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border text-[11px] text-foreground font-mono">
                  <span className="text-[10px] text-foreground-muted block uppercase tracking-wider">
                    Daily Allowance
                  </span>
                  <span className="font-bold text-lime">{plan.dailyRate}</span>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                    </span>
                    <span className="text-xs text-foreground-muted">
                      {plan.name === "Community" ? "" : isAnnual ? "/ mo" : "/ mo"}
                    </span>
                  </div>
                  <span className="text-xs text-foreground-muted block mt-1">
                    {plan.period}
                  </span>
                </div>

                {/* SerpApi Engine Quota Indicator */}
                <div className="mb-5 pb-4 border-b border-border">
                  <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block mb-1">
                    SerpApi Engine Quota
                  </span>
                  <p className="text-[11px] text-foreground-secondary font-sans">
                    {plan.serpapiQuota}
                  </p>
                </div>

                {/* Feature List */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block mb-2">
                    Included Capabilities
                  </span>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-foreground-secondary">
                      <Check className="w-3.5 h-3.5 text-lime flex-shrink-0 mt-0.5" />
                      <span className="font-sans leading-normal text-[11px]">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                <button
                  onClick={() => {
                    if (plan.name === "Community") {
                      router.push("/recon");
                    } else {
                      const displayPrice = isAnnual ? `${plan.priceAnnual} / mo (billed annually)` : `${plan.priceMonthly} / mo`;
                      const amountCents = isAnnual ? plan.amountAnnual : plan.amountMonthly;
                      onUpgradeClick?.(plan.name, displayPrice, amountCents);
                    }
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    plan.highlighted
                      ? isProMember
                        ? "bg-emerald-500 text-black cursor-default"
                        : "bg-lime hover:bg-lime-hover text-background"
                      : "bg-surface-elevated hover:bg-surface-hover text-foreground border border-border"
                  }`}
                >
                  <span>
                    {isProMember && plan.name !== "Community"
                      ? "Change Subscription"
                      : plan.cta}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enterprise Banner Card */}
        <div className="mt-12 max-w-7xl mx-auto rounded-2xl bg-surface border border-border p-8 lg:p-10 relative overflow-hidden font-mono shadow-sm">
          <div className="absolute top-0 right-0 w-96 h-96 bg-lime/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-elevated border border-border text-foreground text-[10px] font-bold uppercase tracking-wider mb-3">
                <Building2 className="w-3.5 h-3.5 text-lime" />
                <span>Enterprise & Custom Infrastructure</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                Managing 100+ domains or need 30k–50M+ SerpApi searches?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-foreground-secondary font-sans leading-relaxed">
                Tailored for organizations managing multi-domain corporate infrastructure with custom SLA requirements, dedicated throughput, SIEM ingestion, and on-premises options.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-foreground-secondary">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime flex-shrink-0" />
                  <span className="font-sans text-[11px]">Custom SerpApi volume (30k to 50,000,000+ searches)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime flex-shrink-0" />
                  <span className="font-sans text-[11px]">SIEM, Splunk & Sentinel Webhook Feeds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime flex-shrink-0" />
                  <span className="font-sans text-[11px]">Dedicated Security Architect & Custom Dorks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime flex-shrink-0" />
                  <span className="font-sans text-[11px]">SOC2 Type II Attestation & On-Premises Option</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 flex-shrink-0">
              <div className="text-left lg:text-right">
                <span className="text-2xl font-bold text-foreground block">Custom Pricing</span>
                <span className="text-[11px] text-foreground-muted font-sans">Tailored SLA & volume</span>
              </div>
              <a
                href="mailto:security@reconflow.ai?subject=Enterprise%20Inquiry%20-%20ReconFlow%20AI"
                className="px-5 py-3 rounded-lg bg-surface-elevated hover:bg-surface-hover text-foreground border border-border hover:border-lime/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Contact Security Engineering</span>
                <ArrowRight className="w-3.5 h-3.5 text-lime" />
              </a>
            </div>
          </div>
        </div>

        {/* Platform & SerpApi Infrastructure Transparency Note */}
        <div className="mt-8 text-center text-xs text-foreground-muted font-sans max-w-3xl mx-auto">
          <p>
            Powered by official SerpApi search engine infrastructure. All paid plans include dedicated multi-engine query allocations, autonomous MCP agent reasoning, and automatic rate-limit proxy management.
          </p>
        </div>
      </div>
    </section>
  );
};
