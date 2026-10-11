"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ProblemSection } from "@/components/ProblemSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { RemediationSection } from "@/components/RemediationSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { PricingSection } from "@/components/PricingSection";
import { FinalCTASection } from "@/components/FinalCTASection";
import { Footer } from "@/components/Footer";
import { PaymentModal } from "@/components/PaymentModal";

export default function Home() {
  const router = useRouter();
  const [isProMember, setIsProMember] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({
    name: "Developer Plan",
    price: "$99 / month",
    amountCents: 9900,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsProMember(localStorage.getItem("reconflow_pro") === "true");
    }
  }, []);

  const handleStartRecon = (target: string = "vulnweb.com") => {
    const clean = target.trim() || "vulnweb.com";
    router.push(`/recon?target=${encodeURIComponent(clean)}`);
  };

  const handleUpgradeClick = (planName: string, price: string, amountCents: number = 9900) => {
    setSelectedPlan({ name: planName, price, amountCents });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsProMember(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("reconflow_pro", "true");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-lime/20 selection:text-lime transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar onStartReconClick={() => handleStartRecon("vulnweb.com")} />

      {/* Hero Section with Three.js Particle Wave */}
      <HeroSection onScanTarget={handleStartRecon} isScanning={false} />

      {/* Section 1: The Perimeter Problem & Live OSINT Terminal */}
      <ProblemSection />

      {/* Section 2: Autonomous Methodology (How It Works) */}
      <HowItWorksSection />

      {/* Section 3: Actionable Triage & Defensive Playbook */}
      <RemediationSection />

      {/* Section 4: 6 Core Capabilities */}
      <CapabilitiesSection />

      {/* Section 5: Predictable Pricing & Pro Tier Upgrade */}
      <PricingSection onUpgradeClick={handleUpgradeClick} isProMember={isProMember} />

      {/* Section 6: Final CTA */}
      <FinalCTASection onScanTarget={handleStartRecon} />

      {/* Footer */}
      <Footer />

      {/* Mock Payment Checkout Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        planName={selectedPlan.name}
        price={selectedPlan.price}
        amountCents={selectedPlan.amountCents}
      />
    </div>
  );
}
