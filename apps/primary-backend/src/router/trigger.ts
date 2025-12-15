import { Router } from "express";
import { prismaClient } from "@flowcatalyst/database";
import { authMiddleware } from "../middleware";

const router = Router();

router.get("/available", async (req, res) => {
  const availableTriggers = await prismaClient.availableTrigger.findMany({
    where: {
      show: true,
    },
  });
  res.json({
    availableTriggers,
  });
});

router.get("/user-triggers", authMiddleware, async (req, res) => {
  //@ts-ignore
  const userId = req.id;

  try {
    const triggerCounts = await prismaClient.trigger.groupBy({
      by: ["triggerId"],
      where: {
        userId,
        zap: { isActive: true },
      },
      _count: {
        triggerId: true,
      },
    });

    const triggerIds = triggerCounts.map((t) => t.triggerId);
    const triggerTypes = await prismaClient.availableTrigger.findMany({
      where: { id: { in: triggerIds } },
      select: { id: true, name: true },
    });

    const triggers = triggerCounts.reduce(
      (acc, count) => {
        const name =
          triggerTypes.find((t) => t.id === count.triggerId)?.name || "Unknown";
        acc[name] = count._count.triggerId;
        return acc;
      },
      {} as Record<string, number>,
    );

    res.json({ success: true, triggers });
  } catch (error) {
    console.error("Failed to Fetch Flow:", error);
    res.status(500).json({ message: "Failed to delete Zap" });
  }
});

export const triggerRouter = router;
