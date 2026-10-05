"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CreditCard,
  Lock,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  Zap,
  Check,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  planName?: string;
  price?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  planName = "Professional Plan",
  price = "$49 / month",
}) => {
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [isQuickProcessing, setIsQuickProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real Stripe Hosted Checkout redirect using test credentials
  const handleStripeCheckoutRedirect = async () => {
    setIsRedirectingToStripe(true);
    setErrorMessage(null);

    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const cleanApiUrl = rawApiUrl.replace(/\/+$/, "");
      const checkoutEndpoint = cleanApiUrl ? `${cleanApiUrl}/api/create-checkout-session` : "/api/create-checkout-session";
      const res = await fetch(checkoutEndpoint, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planName,
          amount: 4900,
          success_url: `${window.location.origin}/recon?session_id={CHECKOUT_SESSION_ID}&upgraded=true`,
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

  // Instant 1-Click Sandbox Test for Hackathon judges
  const handleQuickSandboxTest = () => {
    setIsQuickProcessing(true);
    setTimeout(() => {
      setIsQuickProcessing(false);
      onPaymentSuccess();
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0C0C0C] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#121212] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B7E36A]/10 border border-[#B7E36A]/30 flex items-center justify-center text-[#B7E36A]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Unlock Unlimited Sweeps</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#B7E36A]/15 text-[#B7E36A] border border-[#B7E36A]/40">
                  Pro License
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                Community Tier limit reached (1 scan / day)
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
          {/* Plan Summary Card */}
          <div className="p-3.5 rounded-xl bg-[#141414] border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 font-sans block">Selected Plan</span>
              <span className="text-sm font-bold text-zinc-100">{planName}</span>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-[#B7E36A]">{price}</span>
              <span className="text-[10px] text-zinc-500 block">Cancel anytime</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
              What You Unlock Instantly:
            </span>
            <div className="space-y-1 text-[11px] text-zinc-300 font-sans">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B7E36A] flex-shrink-0" />
                <span>Unlimited target domain reconnaissance sweeps</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B7E36A] flex-shrink-0" />
                <span>Full 6-Engine SerpApi external radar (GitHub, S3, YouTube, Play)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B7E36A] flex-shrink-0" />
                <span>Executive CISO dossier export in Markdown & JSON</span>
              </div>
            </div>
          </div>

          {/* Stripe Test Mode Info */}
          <div className="p-3 rounded-lg bg-[#141414] border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-[#635BFF]" />
                <span>Stripe Test Gateway Active</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#635BFF]/15 text-[#9E98FF] border border-[#635BFF]/30">
                Official API
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
              Connected to real Stripe test checkout with keys (<code className="text-zinc-400">pk_test_51UN8...</code>). Use any Stripe test card (e.g. 4242 4242...).
            </p>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {/* 1. Official Stripe Hosted Checkout */}
            <button
              onClick={handleStripeCheckoutRedirect}
              disabled={isRedirectingToStripe}
              className="w-full py-3 px-4 rounded-lg bg-[#635BFF] hover:bg-[#5249f0] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#635BFF]/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isRedirectingToStripe ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Connecting to Stripe Hosted Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay with Stripe Checkout ($49)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* 2. Instant Hackathon 1-Click Sandbox Test */}
            <button
              type="button"
              onClick={handleQuickSandboxTest}
              disabled={isQuickProcessing}
              className="w-full py-2.5 px-4 rounded-lg bg-[#181818] hover:bg-[#202020] text-zinc-300 hover:text-zinc-100 border border-zinc-700/80 font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isQuickProcessing ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-[#B7E36A] border-t-transparent animate-spin" />
                  <span>Activating Instant Pro...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#B7E36A]" />
                  <span>1-Click Hackathon Bypass (Instant Demo)</span>
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
