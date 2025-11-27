import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().min(3),
  email: z.string().min(5),
  password: z.string().min(6),
});

export const SigninSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const ZapCreateSchema = z.object({
  availableTriggerId: z.string(),
  triggerMetadata: z.any().optional(),
  actions: z.array(
    z.object({
      availableActionId: z.string(),
      actionMetadata: z.any().optional(),
    }),
  ),
});

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  stripePriceId?: string;
  cashfreePlanId?: string;
}
