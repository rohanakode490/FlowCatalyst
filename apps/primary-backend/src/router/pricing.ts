import { prismaClient } from "@flowcatalyst/database";
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const plans = await prismaClient.subscriptionPlan.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        interval: true,
        features: true,
      },
    });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pricing plans" });
  }
});

export const pricingRouter = router;
