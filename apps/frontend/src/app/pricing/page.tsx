"use client";

import Navbar from "@/components/globals/navbar";
import { Footer } from "@/components/footer/footer";
import { Pricing } from "@/components/pricing/pricing-component";

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black [background:radial-gradient(125%_125%_at_50%_10%,#000_35%,#223_100%)] bg-fixed">
      <Navbar />
      <div className="flex-1">
        <Pricing />
      </div>
      <Footer />
    </div>
  );
}
