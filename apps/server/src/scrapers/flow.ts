import { prismaClient } from "@flowentis/database";
import { runIndeedScraper, runLinkedinScraper } from "./runners";
import { runZap } from "../engine/executor";

export const executeScrapingFlow = async (
  triggerId: string,
  scraperType: string,
) => {
  try {
    const trigger = await prismaClient.trigger.findUnique({
      where: { id: triggerId },
      include: {
        zap: true,
        user: {
          include: {
            subscriptions: {
              where: { status: "active" },
              include: { plan: true },
            },
          },
        },
      },
    });

    if (!trigger || !trigger.metadata) return [];

    const isPro = trigger.user.subscriptions.some(
      (sub) => sub.plan.name === "Pro",
    );
    const tierLimit = isPro ? 100 : 20;

    const metadata = trigger.metadata as any;
    const limit = metadata.limit
      ? Math.min(metadata.limit, tierLimit)
      : tierLimit;

    const location = metadata.state
      ? `${metadata.state}, ${metadata.country || "USA"}`
      : metadata.country || "USA";

    let jobs: any[] = [];
    if (scraperType === "INDEED_JOBS") {
      jobs = await runIndeedScraper(
        metadata.keywords?.join(" OR ") || "",
        location,
        metadata.country || "USA",
        limit,
        metadata.is_remote || false,
        metadata.job_type || "",
        metadata.hours_old || 168,
      );
    } else if (scraperType === "LINKEDIN_JOBS") {
      jobs = await runLinkedinScraper(
        metadata.keywords || [],
        location,
        limit,
        0,
        metadata.experience || [],
        metadata.remote || false,
        metadata.job_type || [],
        metadata.listed_at || "86400",
        [],
      );
    }

    if (jobs.length === 0) return [];

    const run = await prismaClient.$transaction(async (tx) => {
      const existingRun = await tx.zapRun.findFirst({
        where: {
          zapId: trigger.zapId,
          metadata: { path: ["type"], equals: scraperType },
        },
        orderBy: { id: "desc" },
      });

      if (existingRun) {
        const existingMetadata = existingRun.metadata as any;
        return await tx.zapRun.update({
          where: { id: existingRun.id },
          data: {
            metadata: {
              ...existingMetadata,
              jobs: [...jobs, ...(existingMetadata.jobs || [])],
              lastUpdated: new Date().toISOString(),
            },
          },
        });
      } else {
        return await tx.zapRun.create({
          data: {
            zapId: trigger.zapId,
            metadata: {
              type: scraperType,
              jobs,
              scrapedAt: new Date().toISOString(),
            },
          },
        });
      }
    });

    runZap(run.id).catch((err) =>
      console.error("Error in async runZap from scraper:", err),
    );
    return jobs;
  } catch (error) {
    console.error(`Error processing scraper trigger ${triggerId}:`, error);
    throw error;
  }
};
