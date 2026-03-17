"use client";

import Navbar from "@/components/globals/navbar";
import { Footer } from "@/components/footer/footer";
import { Pricing } from "@/components/pricing/pricing-component";

export default function PricingPage() {
  return (
    <div className="bg-[#181825] min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Pricing />
      </div>
      <Footer />
    </div>
  );
}
