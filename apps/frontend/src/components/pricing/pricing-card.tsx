"use client";

import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { PricingPlan } from "./pricing-component";
import api from "@/lib/api";
import useStore from "@/lib/store";
import { useState } from "react";

interface PricingCardProps {
  plan: PricingPlan;
}

export const PricingCard = ({ plan }: PricingCardProps) => {
  const router = useRouter();
  const {
    ui: { addToast },
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);

  const RedirectTOPayments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        "/subscription",
        {
          planName: plan.name,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = response.data;

      if (data.paymentLink) {
        window.location.href = data.paymentLink; // Redirect to dodopayment checkout
      } else if (data.success) {
        router.push("/workflows");
      } else {
        throw new Error("Payment Link not Available");
      }
    } catch (error: any) {
      console.error("Payment Error: ", error);
      addToast(
        error.response?.data?.error || "Payment Failed. Please try again.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-xl p-6 bg-card shadow-sm">
      <div className="flex flex-col gap-4">
        <h3 className="text-2xl font-bold">{plan.name}</h3>
        <div className="text-4xl font-bold">
          {plan.price === 0 ? "Free" : `$${(plan.price / 100).toFixed(2)}`}
          <span className="text-lg text-muted-foreground">
            {plan.interval ? `/${plan.interval}` : ""}
          </span>
        </div>

        <ul className="space-y-3 flex-1">
          {plan.features.map((feature: any) => (
            <li key={feature} className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex flex-col ">
          <Button onClick={RedirectTOPayments} disabled={isLoading}>
            {plan.price === 0 ? "Get Started" : "Subscribe"}
          </Button>
        </div>
      </div>
    </div>
  );
};
