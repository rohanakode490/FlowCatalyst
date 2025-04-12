"use client";

import { PricingPlan } from "@/app/pricing/page";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";

interface PricingCardProps {
  plan: PricingPlan;
  onSelect: (paymentMethod: "stripe" | "cashfree") => void;
}

export const PricingCard = ({ plan, onSelect }: PricingCardProps) => {
  return (
    <div className="border rounded-xl p-6 bg-card shadow-sm">
      <div className="flex flex-col gap-4">
        <h3 className="text-2xl font-bold">{plan.name}</h3>
        <div className="text-4xl font-bold">
          {plan.price === 0 ? "Free" : `$${plan.price / 100}`}
          <span className="text-lg text-muted-foreground">
            /{plan.interval}
          </span>
        </div>

        <ul className="space-y-3 flex-1">
          {plan.features.features.map((feature: any) => (
            <li key={feature} className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => onSelect("stripe")}
            disabled={plan.price === 0}
          >
            {plan.price === 0 ? "Get Started" : "Subscribe"}
          </Button>
          {plan.price > 0 && (
            <Button variant="outline" onClick={() => onSelect("cashfree")}>
              Pay via UPI (Cashfree)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
