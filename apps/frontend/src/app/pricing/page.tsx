"use client";

import { useEffect, useState } from "react";
import { PricingCard } from "@/components/pricing/pricing-card";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { PaymentButton } from "@/components/pricing/payment-button";

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: Record<string, string[]>;
  stripePriceId?: string;
  cashfreePlanId?: string;
}

export default function PricingPage() {
  // const tiers = [
  //   {
  //     title: "Starter",
  //     price: "Free",
  //     features: [
  //       "5 workflow automations",
  //       "Basic integrations",
  //       "Community support",
  //       "1 team member",
  //       "100 executions/month",
  //     ],
  //     buttonText: "Get Started",
  //     buttonHref: "/signup",
  //   },
  //   {
  //     title: "Pro",
  //     price: "$29",
  //     interval: "/month",
  //     features: [
  //       "Unlimited automations",
  //       "Premium integrations",
  //       "Priority support",
  //       "5 team members",
  //       "10,000 executions/month",
  //       "Webhook access",
  //     ],
  //     isPopular: true,
  //     buttonText: "Subscribe Now",
  //     buttonHref: "/subscribe/pro",
  //   },
  //   {
  //     title: "Enterprise",
  //     price: "$50",
  //     interval: "/month",
  //     features: [
  //       "Dedicated infrastructure",
  //       "SLA & 24/7 support",
  //       "Unlimited team members",
  //       "Custom integrations",
  //       "SSO & SAML",
  //       "Security audit",
  //     ],
  //     buttonText: "Contact Sales",
  //     buttonHref: "/contact",
  //   },
  // ];
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const pricing = await api.get("/pricing");
        setPlans(pricing.data);
      } catch (err) {
        setError("Failed to load pricing plans");
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <main className="[background:radial-gradient(125%_125%_at_50%_10%,#000_35%,#223_100%)]">
      <section className="pt-24 pb-12">
        <div className="container px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-neutral-400 text-lg">
              Start free. Upgrade as you grow. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                onSelect={(paymentMethod) => (
                  <PaymentButton plan={plan} paymentMethod={paymentMethod} />
                )}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
