import { prismaClient } from "@flowcatalyst/database";
import { executeScrapingFlow } from "../scrapers/flow";

export const startScheduler = async () => {
  // Interval of 10 hours for checking due jobs
  const CHECK_INTERVAL = 15 * 60 * 1000;

  setInterval(async () => {
    console.info("Scheduler: Checking for due jobs...");
    const now = new Date();
    try {
      const dueJobs = await prismaClient.jobSchedule.findMany({
        where: { nextRunAt: { lte: now }, isActive: true },
        include: { trigger: true },
      });

      console.info(`Scheduler: Found ${dueJobs.length} due jobs.`);

      for (const job of dueJobs) {
        try {
          const scraperType = (job.trigger.metadata as any)?.type || "";
          await executeScrapingFlow(job.triggerId, scraperType);

          await prismaClient.jobSchedule.update({
            where: { id: job.id },
            data: {
              nextRunAt: new Date(
                now.getTime() + job.interval * 60 * 60 * 1000,
              ),
              updatedAt: now,
            },
          });

          // Small delay to prevent burst execution
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (jobError) {
          console.error(`Scheduler: Error processing job ${job.id}:`, jobError);
        }
      }
    } catch (e) {
      console.error("Scheduler: Critical error in interval:", e);
    }
  }, CHECK_INTERVAL);
};
