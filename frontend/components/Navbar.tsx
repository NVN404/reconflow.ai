"use client";

import React, { useState, useEffect } from "react";
import { Download, Terminal } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

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
          ? "bg-background/90 backdrop-blur-md border-b border-border py-3 shadow-sm"
          : "bg-transparent py-4 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-8 h-8 rounded-md bg-surface-elevated border border-border flex items-center justify-center font-mono font-bold text-xs shadow-inner">
            <span className="text-lime font-black text-sm">RF</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground font-mono">
                RECONFLOW<span className="text-lime">.AI</span>
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-surface-elevated text-foreground-muted border border-border">
                v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-foreground-secondary">
          <button
            onClick={() => scrollToSection("problem")}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            The Problem
          </button>
          <a
            href="/recon"
            className="text-lime hover:opacity-80 transition-colors cursor-pointer font-mono font-bold flex items-center gap-1"
          >
            <span>Live Recon Graph →</span>
          </a>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Pricing
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {onExportDossier && (
            <button
              onClick={onExportDossier}
              className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated text-foreground border border-border transition-all cursor-pointer shadow-sm"
              title="Download executive audit dossier markdown"
            >
              <Download className="w-3.5 h-3.5 text-lime" />
              <span>Export Dossier</span>
            </button>
          )}

          <button
            onClick={onStartReconClick}
            className="flex items-center gap-2 text-xs font-mono font-semibold px-4 py-2 rounded-md bg-foreground hover:opacity-90 text-background transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-background" />
            <span>Start Recon</span>
          </button>
        </div>
      </div>
    </header>
  );
};
