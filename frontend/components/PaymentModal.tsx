"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Lock,
  X,
  Zap,
  Check,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
  planName?: string;
  price?: string;
  amountCents?: number;
}

const AVAILABLE_PLANS = [
  {
    id: "Starter",
    name: "Starter Plan",
    price: "$39 / month",
    amountCents: 3900,
    dailyLimit: "3 scans / day",
    serpapiQuota: "1,000 SerpApi searches/mo",
    features: [
      "3 Target domain sweeps / day (~100 scans/mo)",
      "1,000 SerpApi multi-engine queries / mo",
      "Interactive Attack Surface Graph with Dagre layout",
      "Remediation playbooks & risk severity scoring",
      "Standard email support",
    ],
  },
  {
    id: "Developer",
    name: "Developer Plan",
    price: "$99 / month",
    amountCents: 9900,
    dailyLimit: "15 scans / day",
    serpapiQuota: "5,000 SerpApi searches/mo",
    badge: "MOST POPULAR",
    features: [
      "15 Target domain sweeps / day (~450 scans/mo)",
      "5,000 SerpApi recon queries / mo (Phase 1 & Phase 2)",
      "Autonomous SerpApi MCP Agent with live reasoning",
      "Full 6-Engine Deep Recon (GitHub, S3, Play, YouTube)",
      "Automated CVSS & OWASP remediation playbooks",
      "Executive dossier export in Markdown & JSON",
    ],
  },
  {
    id: "Production",
    name: "Production Plan",
    price: "$199 / month",
    amountCents: 19900,
    dailyLimit: "50 scans / day",
    serpapiQuota: "15,000 SerpApi searches/mo",
    badge: "HIGH VOLUME",
    features: [
      "50 Target domain sweeps / day (~1,500 scans/mo)",
      "15,000 SerpApi high-throughput queries / mo",
      "Dual Hybrid Engine (Direct REST + SerpApi MCP)",
      "Continuous attack surface monitoring & SIEM feeds",
      "Custom dork operators & compliance dossier generation",
      "24/7 Priority SLA & engineering support",
    ],
  },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  planName = "Developer Plan",
  price = "$99 / month",
  amountCents = 9900,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    if (planName.toLowerCase().includes("starter")) return "Starter";
    if (planName.toLowerCase().includes("production")) return "Production";
    return "Developer";
  });

  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync selectedPlanId if incoming planName prop changes
  React.useEffect(() => {
    if (planName.toLowerCase().includes("starter")) setSelectedPlanId("Starter");
    else if (planName.toLowerCase().includes("production")) setSelectedPlanId("Production");
    else setSelectedPlanId("Developer");
  }, [planName]);

  if (!isOpen) return null;

  const currentPlan =
    AVAILABLE_PLANS.find((p) => p.id === selectedPlanId) || AVAILABLE_PLANS[1];

  // Real Stripe Hosted Checkout redirect
  const handleStripeCheckoutRedirect = async () => {
    setIsRedirectingToStripe(true);
    setErrorMessage(null);

    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const cleanApiUrl = rawApiUrl.replace(/\/+$/, "");
      const checkoutEndpoint = cleanApiUrl
        ? `${cleanApiUrl}/api/create-checkout-session`
        : "/api/create-checkout-session";

      const res = await fetch(checkoutEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: currentPlan.name,
          amount: currentPlan.amountCents,
          success_url: `${window.location.origin}/recon?session_id={CHECKOUT_SESSION_ID}&upgraded=true&plan=${encodeURIComponent(currentPlan.name)}`,
          cancel_url: `${window.location.origin}/recon?canceled=true`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No checkout URL returned by backend.");
      }
    } catch (err: any) {
      console.error("Stripe Checkout Error:", err);
      setErrorMessage(err.message || "Failed to initialize Stripe checkout.");
      setIsRedirectingToStripe(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0C0C0C] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#121212] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#635BFF]/15 border border-[#635BFF]/30 flex items-center justify-center text-[#635BFF]">
              <Zap className="w-4 h-4 fill-[#635BFF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Unlock Daily Sweeps</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#635BFF]/20 text-[#A29BFE] border border-[#635BFF]/40">
                  Stripe Checkout
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                1st scan free completed • Select a tier to continue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Plan Selector Pills */}
          <div className="grid grid-cols-3 gap-2">
            {AVAILABLE_PLANS.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[#18181b] border-lime text-zinc-100 shadow-md ring-1 ring-lime/40"
                      : "bg-[#121212] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-lime text-black text-[9px] font-bold uppercase">
                      {plan.id === "Developer" ? "POPULAR" : "HIGH VOL"}
                    </span>
                  )}
                  <span className="text-xs font-bold block">{plan.id}</span>
                  <span className={`text-[11px] font-bold block mt-0.5 ${isSelected ? "text-lime" : "text-zinc-300"}`}>
                    {plan.price.split(" ")[0]}<span className="text-[10px] text-zinc-500 font-normal">/mo</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 block font-sans truncate">
                    {plan.dailyLimit}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Plan Summary Banner */}
          <div className="p-3.5 rounded-xl bg-[#141414] border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 font-sans block uppercase tracking-wider">Active Plan</span>
              <span className="text-sm font-bold text-zinc-100">{currentPlan.name}</span>
              <span className="text-[11px] text-zinc-400 font-sans block">{currentPlan.serpapiQuota}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-lime">{currentPlan.price}</span>
              <span className="text-[10px] text-zinc-500 block">Cancel anytime</span>
            </div>
          </div>

          {/* Included Features */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
              What You Unlock with {currentPlan.name}:
            </span>
            <div className="space-y-1.5 text-[11px] text-zinc-300 font-sans">
              {currentPlan.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lime flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stripe Trust Callout */}
          <div className="p-3 rounded-lg bg-[#141414] border border-zinc-800/90 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-200 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-[#635BFF]" />
                <span>Official Stripe Payment Gateway</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                Verified
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
              Redirecting to Stripe’s secure hosted checkout page. Powered by official SerpApi infrastructure with platform developer profit.
            </p>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button: Stripe Checkout */}
          <div className="pt-2">
            <button
              onClick={handleStripeCheckoutRedirect}
              disabled={isRedirectingToStripe}
              className="w-full py-3.5 px-4 rounded-lg bg-[#635BFF] hover:bg-[#5249f0] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#635BFF]/25 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isRedirectingToStripe ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Redirecting to Stripe Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay with Stripe Checkout ({currentPlan.price.split(" ")[0]}/mo)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-[#121212] border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>256-Bit SSL Encrypted</span>
          </span>
          <span>PCI-DSS Level 1 Certified</span>
        </div>
      </motion.div>
    </div>
  );
};
