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
    name: "Professional Plan",
    price: "$49 / month",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsProMember(localStorage.getItem("reconflow_pro") === "true");
    }
  }, []);

  const handleStartRecon = (target: string = "reconflow.render.com") => {
    const clean = target.trim() || "reconflow.render.com";
    router.push(`/recon?target=${encodeURIComponent(clean)}`);
  };

  const handleUpgradeClick = (planName: string, price: string) => {
    setSelectedPlan({ name: planName, price });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsProMember(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("reconflow_pro", "true");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F7F7F5] flex flex-col font-sans selection:bg-[#B7E36A]/20 selection:text-[#B7E36A]">
      {/* Top Navbar */}
      <Navbar onStartReconClick={() => handleStartRecon("reconflow.render.com")} />

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
      />
    </div>
  );
}
