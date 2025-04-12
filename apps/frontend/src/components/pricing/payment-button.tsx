"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { PricingPlan } from "@/app/pricing/page";

interface PaymentButtonProps {
  plan: PricingPlan;
  paymentMethod: "stripe" | "cashfree";
}

export const PaymentButton = ({ plan, paymentMethod }: PaymentButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await api.post("/subscription", {
        planId: plan.id,
        paymentMethod,
      });

      const data = await response.data;

      if (paymentMethod === "cashfree" && data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        throw new Error("Payment link not available");
      }
    } catch (error: any) {
      toast.error("Payment Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={loading} className="w-full gap-2">
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {paymentMethod === "stripe" ? "Pay with Stripe" : "Pay via UPI"}
    </Button>
  );
};
