import { Router } from "express";
import { prismaClient } from "@flowcatalyst/database";

const router = Router();

router.get("/available", async (req, res) => {
  const availableTriggers = await prismaClient.availableTrigger.findMany({});
  res.json({
    availableTriggers,
  });
});

export const triggerRouter = router;
