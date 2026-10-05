"use client";

import React, { useState, useEffect } from "react";
import { Download, Terminal } from "lucide-react";

interface NavbarProps {
  onExportDossier?: () => void;
  onStartReconClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onExportDossier, onStartReconClick }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-[#050505]/90 backdrop-blur-md border-b border-zinc-800/80 py-3 shadow-sm"
          : "bg-transparent py-4 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-8 h-8 rounded-md bg-[#111111] border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs shadow-inner">
            <span className="text-[#B7E36A] font-black text-sm">RF</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-zinc-100 font-mono">
                RECONFLOW<span className="text-[#B7E36A]">.AI</span>
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
          <button
            onClick={() => scrollToSection("problem")}
            className="hover:text-zinc-100 transition-colors cursor-pointer"
          >
            The Problem
          </button>
          <a
            href="/recon"
            className="text-[#B7E36A] hover:text-white transition-colors cursor-pointer font-mono font-bold flex items-center gap-1"
          >
            <span>Live Recon Graph →</span>
          </a>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="hover:text-zinc-100 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Pricing
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {onExportDossier && (
            <button
              onClick={onExportDossier}
              className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-md bg-[#0B0B0B] hover:bg-[#111111] text-zinc-200 border border-zinc-800 transition-all cursor-pointer"
              title="Download executive audit dossier markdown"
            >
              <Download className="w-3.5 h-3.5 text-[#B7E36A]" />
              <span>Export Dossier</span>
            </button>
          )}

          <button
            onClick={onStartReconClick}
            className="flex items-center gap-2 text-xs font-mono font-semibold px-4 py-2 rounded-md bg-zinc-100 hover:bg-white text-[#050505] transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-[#050505]" />
            <span>Start Recon</span>
          </button>
        </div>
      </div>
    </header>
  );
};
