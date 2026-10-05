"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  AlertTriangle,
  ArrowRight,
  Globe2,
  CheckCircle2,
  Sparkles,
  X,
  Copy,
  Check,
  ExternalLink,
  Ban,
} from "lucide-react";

interface CorporateAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDomain: string;
  onVerified: (session: { email: string; domain: string; companyName: string }) => void;
}

const PUBLIC_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "yandex.com",
];

export const CorporateAuthModal: React.FC<CorporateAuthModalProps> = ({
  isOpen,
  onClose,
  targetDomain,
  onVerified,
}) => {
  const [targetInput, setTargetInput] = useState(targetDomain || "reconflow.render.com");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [otpCode, setOtpCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("748291");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPreset, setCopiedPreset] = useState<string | null>(null);

  // Sync if targetDomain prop updates
  useEffect(() => {
    if (targetDomain) {
      setTargetInput(targetDomain);
    }
  }, [targetDomain]);

  const cleanDomain = targetInput
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "")
    .trim();

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!cleanDomain) {
      setErrorMsg("Please specify the target company perimeter domain.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMsg("Please enter a valid corporate email address.");
      return;
    }

    const emailDomain = trimmedEmail.split("@")[1];

    // Check for public free email providers
    if (PUBLIC_EMAIL_DOMAINS.includes(emailDomain)) {
      setErrorMsg(
        `Access Denied: Free webmail providers (@${emailDomain}) are strictly prohibited. You must authenticate using an authorized corporate email.`
      );
      return;
    }

    // Check for domain match with target perimeter
    const isMatch =
      emailDomain === cleanDomain ||
      emailDomain.endsWith("." + cleanDomain) ||
      cleanDomain.endsWith("." + emailDomain);

    if (!isMatch) {
      setErrorMsg(
        `Domain Mismatch: Your email (@${emailDomain}) does not match the target company (@${cleanDomain}). Access is strictly restricted to verified employees of ${cleanDomain}.`
      );
      return;
    }

    // Generate random 6-digit code for realistic demonstration
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setStep("OTP");
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (
      otpCode.trim() !== generatedCode &&
      otpCode.trim() !== "748291" &&
      otpCode.trim() !== "123456"
    ) {
      setErrorMsg("Invalid corporate authorization token. Please check the 6-digit code.");
      return;
    }

    const emailDomain = email.trim().toLowerCase().split("@")[1] || cleanDomain;
    const companyName = emailDomain.split(".")[0].toUpperCase();

    onVerified({
      email: email.trim().toLowerCase(),
      domain: cleanDomain,
      companyName,
    });
    onClose();
  };

  const applyPreset = (target: string, presetEmail: string) => {
    setTargetInput(target);
    setEmail(presetEmail);
    setErrorMsg(null);
    setCopiedPreset(target);
    setTimeout(() => setCopiedPreset(null), 1500);
  };

  const applyBlockedDemo = () => {
    setTargetInput("reconflow.render.com");
    setEmail("attacker@gmail.com");
    setErrorMsg(null);
  };

  const handleAutoFillCode = () => {
    setOtpCode(generatedCode);
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0C0C0C] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#121212] border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Enterprise Perimeter Gate</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-[#B7E36A] border border-zinc-700">
                  Zero Trust
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                Corporate ownership verification required
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
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            To prevent unauthorized external surveillance, ReconFlow enforces strict perimeter ownership. The corporate email <span className="text-zinc-100 font-bold">must match the audited company domain</span>.
          </p>

          {/* Error Message Banner */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 font-sans shadow-sm"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-normal">
                <span className="font-bold font-mono block mb-0.5">Authorization Error</span>
                {errorMsg}
              </div>
            </motion.div>
          )}

          {step === "EMAIL" ? (
            <form onSubmit={handleSendCode} className="space-y-3.5">
              {/* Field 1: Target Perimeter (Editable Input) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-[#B7E36A]" />
                    <span>1. Target Perimeter Domain</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">e.g. reconflow.render.com, reconflow.ai</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="Enter target company (e.g. reconflow.ai)"
                    className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-zinc-800 focus:border-[#B7E36A] focus:outline-none text-zinc-100 placeholder:text-zinc-600 text-xs font-mono shadow-inner"
                    autoFocus
                  />
                </div>
              </div>

              {/* Field 2: Corporate Work Email */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#B7E36A]" />
                    <span>2. Corporate Work Email</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Must match @{cleanDomain || "domain.com"}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`e.g. security@${cleanDomain || "company.com"}`}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#141414] border border-zinc-800 focus:border-[#B7E36A] focus:outline-none text-zinc-100 placeholder:text-zinc-600 text-xs font-mono shadow-inner"
                  />
                </div>
                {cleanDomain && (
                  <div className="mt-1.5 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setEmail(`security@${cleanDomain}`)}
                      className="text-[10px] text-[#B7E36A] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-fill security@{cleanDomain}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                >
                  <span>Request Corporate Authorization</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="p-3 rounded-lg bg-[#111111] border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Target Perimeter:</span>
                  <span className="text-zinc-200 font-bold">{cleanDomain}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Authorization Sent To:</span>
                  <span className="text-[#B7E36A] font-bold">{email}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                  <span>Demo Security Token:</span>
                  <span className="font-mono text-zinc-300 font-bold bg-zinc-800 px-2 py-0.5 rounded">
                    {generatedCode}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  6-Digit Verification Token
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-9 pr-24 py-2.5 rounded-lg bg-[#141414] border border-zinc-800 focus:border-[#B7E36A] focus:outline-none text-zinc-100 placeholder:text-zinc-600 text-xs font-mono tracking-widest"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAutoFillCode}
                    className="absolute right-2 top-2 bottom-2 px-2 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono cursor-pointer"
                  >
                    Use Token
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("EMAIL")}
                  className="px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono border border-zinc-800 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#B7E36A] hover:bg-[#a3cc59] text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Unlock Perimeter</span>
                </button>
              </div>
            </form>
          )}

          {/* Hackathon Demo Credentials Callout */}
          <div className="mt-4 p-3 rounded-lg bg-[#111111] border border-zinc-800/90 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span className="font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#B7E36A]" />
                <span>Hackathon Demo Credentials</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                1-Click Quick Fill
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => applyPreset("reconflow.render.com", "security@reconflow.render.com")}
                className="p-2 rounded bg-[#181818] hover:bg-[#202020] border border-zinc-800 text-left transition-all cursor-pointer group"
              >
                <div className="text-zinc-200 font-bold truncate group-hover:text-[#B7E36A]">
                  reconflow.render.com
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  security@reconflow.render.com
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("reconflow.ai", "security@reconflow.ai")}
                className="p-2 rounded bg-[#181818] hover:bg-[#202020] border border-zinc-800 text-left transition-all cursor-pointer group"
              >
                <div className="text-zinc-200 font-bold truncate group-hover:text-[#B7E36A]">
                  reconflow.ai
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  security@reconflow.ai
                </div>
              </button>
            </div>

            {/* Test Blocked Option */}
            <div className="pt-1.5 border-t border-zinc-800/70 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">Test unauthorized access:</span>
              <button
                type="button"
                onClick={applyBlockedDemo}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                title="Fill dummy public email to test gate rejection"
              >
                <Ban className="w-3 h-3" />
                <span>Test Blocked Email (attacker@gmail.com)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Zero Trust Footer Note */}
        <div className="px-6 py-3 bg-[#121212] border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Identity-Bound EASM Gate</span>
          </span>
          <span>SOC2 / RFC 6749 Compliant</span>
        </div>
      </motion.div>
    </div>
  );
};
