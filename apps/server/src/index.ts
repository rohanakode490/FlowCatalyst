import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import { prismaClient } from "@flowentis/database";
import { handleGitHubWebhook } from "./webhooks/github-handlers";
import { executeScrapingFlow } from "./scrapers/flow";
import { startScheduler } from "./scheduler/scheduler";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

/**
 * Webhook Endpoints
 */
app.post(
  "/github-webhook/:eventType/:userId/:zapId",
  (req: Request, res: Response) => {
    const { eventType } = req.params;
    handleGitHubWebhook(req, res, eventType);
  },
);

/**
 * Scraping / Scheduling Endpoints
 */
app.post("/schedule", async (req: Request, res: Response) => {
  const { triggerId, scraperType, userId } = req.body;
  try {
    if (!triggerId || !userId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing triggerId or userId" });
    }

    const nextRunAt = new Date(Date.now() + 10 * 60 * 60 * 1000);

    // Find if a schedule already exists to get its ID for upsert
    const existingSchedule = await prismaClient.jobSchedule.findFirst({
      where: { triggerId, userId },
    });

    await prismaClient.jobSchedule.upsert({
      where: { id: existingSchedule?.id || "new_placeholder_id" },
      update: { isActive: true, nextRunAt, updatedAt: new Date() },
      create: { triggerId, userId, interval: 10, nextRunAt },
    });

    const jobs = await executeScrapingFlow(triggerId, scraperType);
    res.json({ success: true, jobs });
  } catch (error: any) {
    console.error("Schedule endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Background Scheduler
startScheduler();

const PORT = process.env.PORT || 7860;
app.listen(PORT, () => {
  console.log(`🚀 Flowentis Server running on port ${PORT}`);
});
