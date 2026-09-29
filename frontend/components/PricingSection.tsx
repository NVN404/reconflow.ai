"use client";

import React, { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Community",
      priceMonthly: "$0",
      priceAnnual: "$0",
      period: "forever free",
      desc: "For security researchers and individual developers exploring external attack surfaces.",
      features: [
        "1 Target Domain Audit / day",
        "Passive SerpApi Multi-Engine Sweeps",
        "Interactive Attack Surface Graph",
        "Basic Triage & Evidence Snippets",
        "Community Support",
      ],
      cta: "Start Free Audit",
      highlighted: false,
    },
    {
      name: "Professional",
      priceMonthly: "$49",
      priceAnnual: "$39",
      period: isAnnual ? "per month, billed annually" : "per month",
      desc: "For growing security engineering teams requiring continuous attack-surface monitoring.",
      features: [
        "Unlimited Target Domain Sweeps",
        "Full 6-Engine SerpApi Recon (Phase 1 & Phase 2)",
        "Automated CVSS & OWASP AI Triage",
        "Copy-Paste Defensive Remediation Playbooks",
        "Executive Dossier Export (Markdown & JSON)",
        "Priority Support & API Access",
      ],
      cta: "Start 14-Day Free Trial",
      highlighted: true,
      badge: "MOST POPULAR",
    },
    {
      name: "Enterprise",
      priceMonthly: "Custom",
      priceAnnual: "Custom",
      period: "tailored for organizations",
      desc: "For enterprises managing multi-domain corporate infrastructure with custom SLA requirements.",
      features: [
        "Continuous Multi-Domain Surface Tracking",
        "Custom SerpApi Dork Operator Integrations",
        "SIEM & Webhook Event Streaming",
        "Dedicated Security Architect",
        "Custom Remediation SLA & On-Prem Options",
        "SOC2 Compliance Dossier Generation",
      ],
      cta: "Contact Security Engineering",
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
            Clear, transparent pricing for teams of any scale.
          </h2>
          <p className="mt-4 text-base text-foreground-secondary font-normal leading-relaxed">
            Choose the plan that fits your organization's attack-surface intelligence requirements.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3 font-mono text-xs">
            <span className={!isAnnual ? "text-foreground font-bold" : "text-foreground-muted"}>
              Monthly Billing
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-surface-elevated p-1 relative transition-colors border border-border cursor-pointer"
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

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto font-mono">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -4 }}
              className={`rounded-xl p-8 flex flex-col justify-between relative transition-all ${
                plan.highlighted
                  ? "bg-surface-elevated border-2 border-lime shadow-xl shadow-lime/5"
                  : "bg-surface border border-border hover:border-border-strong"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-lime text-background text-[10px] font-bold tracking-wider uppercase">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">
                    {plan.name}
                  </h3>
                </div>

                <p className="text-xs text-foreground-secondary font-sans leading-relaxed mb-6">
                  {plan.desc}
                </p>

                <div className="mb-8">
                  <span className="text-4xl font-bold text-foreground">
                    {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                  </span>
                  <span className="text-xs text-foreground-muted ml-2 block mt-1">
                    {plan.period}
                  </span>
                </div>

                {/* Feature List */}
                <div className="space-y-3 pt-6 border-t border-border">
                  <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block mb-2">
                    Included Features
                  </span>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-foreground-secondary">
                      <Check className="w-4 h-4 text-foreground-muted flex-shrink-0 mt-0.5" />
                      <span className="font-sans leading-normal">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <button
                  className={`w-full py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    plan.highlighted
                      ? "bg-lime hover:bg-lime-hover text-background"
                      : "bg-surface-elevated hover:bg-surface-hover text-foreground border border-border"
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
