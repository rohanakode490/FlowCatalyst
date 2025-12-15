"use client";

// import { useEffect, useState } from "react";
// import { PricingCard } from "@/components/pricing/pricing-card";
// import { motion } from "framer-motion";
// import api from "@/lib/api";
import { Pricing } from "@/components/pricing/pricing-component";

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
  // const [plans, setPlans] = useState<PricingPlan[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState("");
  //
  // useEffect(() => {
  //   const loadPlans = async () => {
  //     try {
  //       const pricing = await api.get("/pricing");
  //       setPlans(pricing.data);
  //     } catch (err) {
  //       setError("Failed to load pricing plans");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadPlans();
  // }, []);
  // if (loading) return <div>Loading...</div>;
  // if (error) return <div>{error}</div>;

  return (
    <>
      <Pricing />
    </>
  );
}
