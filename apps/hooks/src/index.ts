import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { Prisma, prismaClient } from "@flowcatalyst/database";
const path = require("path");
const { spawn } = require("child_process");

dotenv.config();

type PrismaTransactionalClient = Prisma.TransactionClient;

const app = express();
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

type EventData = {
  eventType: string;
  action: string;
  user: string;
  issue_title?: string;
  issue_url?: string;
  pullRequest_title?: string;
  pullRequest_url?: string;
  FromSolanaAddress?: string;
  ToSolanaAddress?: string;
  Amount?: number;
};

// Parameters types for each scraper
type IndeedScraperParams = [
  searchTerm: string,
  location: string,
  country: string,
  resultsWanted: number,
  isRemote: boolean,
  jobType: string,
  hoursOld: number,
];

type LinkedInScraperParams = [
  keywords: string[],
  location: string,
  limit: number,
  offset: number,
  experience: string[],
  remote: boolean,
  jobType: string[],
  listed_at: string,
  existingUrns: string[],
];

// Event-Specific Handlers
const handlePullRequestEvent = (payload: any): EventData | null => {
  const { action, pull_request, sender } = payload;

  // Only process if the pull request is opened
  if (action !== "opened") {
    return null;
  }

  return {
    eventType: "pull_request",
    action,
    user: sender.login,
    pullRequest_title: pull_request.title,
    pullRequest_url: pull_request.html_url,
  };
};

const handleIssueCommentEvent = (payload: any): EventData | null => {
  const { action, issue, comment, sender } = payload;

  // Check if the comment is a bounty
  const bountyRegex = /bounty:\s*{([^}]+)}/;
  const match = comment.body.match(bountyRegex);
  const isBounty = !!match;

  // Only process if the comment is created
  if (
    !isBounty ||
    action !== "created" ||
    (comment.author_association !== "MEMBER" &&
      comment.author_association !== "OWNER")
  ) {
    return null;
  }

  // Base event data
  const eventData: EventData = {
    eventType: "issue_comment",
    action,
    user: sender.login,
    issue_title: issue.title,
    issue_url: issue.html_url,
  };

  try {
    // Extract the content inside the bounty block
    const bountyContent = match[1];

    // If strict JSON parsing fails, try flexible single-quote syntax
    const flexibleJson = bountyContent
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Replace unquoted keys
      .replace(/:\s*'([^']*)'/g, ': "$1"'); // Replace single-quoted strings

    const bountyData = JSON.parse(`{${flexibleJson}}`);

    // Validate required fields
    if (
      typeof bountyData.FromSolanaAddress === "string" &&
      typeof bountyData.ToSolanaAddress === "string" &&
      typeof bountyData.Amount === "number"
    ) {
      eventData.FromSolanaAddress = bountyData.FromSolanaAddress;
      eventData.ToSolanaAddress = bountyData.ToSolanaAddress;
      eventData.Amount = bountyData.Amount;
      eventData.eventType = "bounty"; // Override event type for bounties
    } else {
      throw new Error("Invalid bounty fields");
    }
  } catch (error) {
    console.error("Failed to parse bounty details:", error);
    throw new Error("Invalid bounty format in comment");
  }

  return eventData;
};

const handleIssuesEvent = (payload: any): EventData | null => {
  const { action, issue, sender } = payload;

  // Only process if the issue is opened
  if (action !== "opened") {
    return null;
  }

  return {
    eventType: "issues",
    action,
    user: sender.login,
    issue_title: issue.title,
    issue_url: issue.html_url,
  };
};

// Centralized Webhook Handler
const handleGitHubWebhook = async (
  req: Request,
  res: Response,
  eventType: string,
) => {
  const userId = req.params.userId;
  const zapId = req.params.zapId;
  const payload = req.body;

  try {
    let eventData: EventData | null = null;

    // Route based on event type
    switch (eventType) {
      case "pull_request":
        eventData = handlePullRequestEvent(payload);
        break;
      case "issue_comment":
        eventData = handleIssueCommentEvent(payload);
        break;
      case "issues":
        eventData = handleIssuesEvent(payload);
        break;
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }

    // Only store data if the event is valid and meets the conditions
    if (eventData) {
      await prismaClient.$transaction(async (tx: PrismaTransactionalClient) => {
        const run = await tx.zapRun.create({
          data: {
            zapId: zapId,
            metadata: eventData, // Store the parsed event data
          },
        });

        await tx.zapRunOutbox.create({
          data: {
            zapRunId: run.id,
          },
        });
      });

      res.json({ message: "Webhook received and processed successfully" });
    } else {
      res.json({
        message: "Webhook received but not processed (condition not met)",
      });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({
      error,
    });
  }
};

// GitHub Webhook Endpoints
app.post(
  "/github-webhook/:eventType/:userId/:zapId",
  (req: Request, res: Response) => {
    const eventType = req.params.eventType; // issue_comment, pull_request, issues
    handleGitHubWebhook(req, res, eventType);
  },
);

// Python LinkedIn Scraper Execution
const runLinkedinScraper = (
  keywords: string[],
  location: string,
  limit: number,
  offset: number,
  experience: string[],
  remote: boolean,
  jobType: string[],
  listed_at: string,
  existingUrns: string[],
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      __dirname,
      "..",
      "linkedin-scraper",
      "linkedin-scraper.py",
    );
    // const pythonCommand =
    //   "/mnt/f/Project/FlowCatalyst/apps/hooks/venv/bin/python3";
    // "python3";
    const pythonCommand = process.env.VIRTUAL_ENV
      ? `${process.env.VIRTUAL_ENV}/bin/python`
      : "python";

    const keywords_list = keywords.join(" OR ") || "";
    const args = [
      scriptPath,
      keywords_list,
      location,
      limit,
      offset,
      JSON.stringify(experience),
      JSON.stringify(remote),
      JSON.stringify(jobType),
      listed_at,
      JSON.stringify(existingUrns),
    ];

    const pythonProcess = spawn(pythonCommand, args);
    let output = "";

    pythonProcess.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data: Buffer) => {
      console.error(`Python error: ${data}`);
      reject(data.toString());
    });

    pythonProcess.on("close", (code: number) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (error) {
          reject("Failed to parse Python output");
        }
      } else {
        reject(`Python script exited with code ${code}`);
      }
    });
  });
};

// Python Indeed Scraper Execution
const runIndeedScraper = (
  searchTerm: string,
  location: string,
  country: string,
  resultsWanted: number,
  isRemote: boolean,
  jobType: string,
  hoursOld: number,
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      __dirname,
      "..",
      "indeed-scraper",
      "indeed-scraper.py",
    );
    const pythonCommand = process.env.VIRTUAL_ENV
      ? `${process.env.VIRTUAL_ENV}/bin/python`
      : "python3"; // Prefer python3 over python for consistency

    const args = [
      scriptPath,
      searchTerm,
      location,
      country,
      resultsWanted.toString(),
      isRemote.toString(),
      jobType,
      hoursOld.toString(),
    ];

    const pythonProcess = spawn(pythonCommand, args);
    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code: number) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (error) {
          console.error("Failed to parse Python output", { error, output });
          reject(new Error("Failed to parse Python output"));
        }
      } else {
        console.error("Python script failed", { code, errorOutput });
        reject(
          new Error(`Python script exited with code ${code}: ${errorOutput}`),
        );
      }
    });
  });
};

// Helper to map trigger metadata to scraper parameters
const getScraperParams = (
  trigger: any,
  scraperType: string,
): {
  scraper: (...args: any[]) => Promise<any[]>;
  params: IndeedScraperParams | LinkedInScraperParams;
} => {
  const metadata = trigger.metadata || {};
  const location =
    metadata.state && metadata.state !== ""
      ? `${metadata.state}, ${metadata.country || "USA"}`
      : metadata.country || "USA";

  if (scraperType === "INDEED_JOBS") {
    return {
      scraper: runIndeedScraper,
      params: [
        metadata.keywords?.join(" OR ") || "",
        location,
        metadata.country || "USA",
        metadata.limit || 10,
        metadata.is_remote || false,
        metadata.job_type || "",
        metadata.hours_old || 24 * 7,
      ] as IndeedScraperParams,
    };
  } else if (scraperType === "LINKEDIN_JOBS") {
    // Placeholder for LinkedIn
    return {
      scraper: runLinkedinScraper,
      params: [
        metadata.keywords || [],
        location,
        metadata.limit || 10,
        0,
        metadata.experience || [],
        metadata.remote || false,
        metadata.job_type || [],
        metadata.listed_at || "86400",
        [],
      ] as LinkedInScraperParams,
    };
  } else {
    return {
      scraper: () => Promise.resolve([]),
      params: [
        metadata.keywords || [],
        location,
        metadata.limit || 10,
        0,
        metadata.experience || [],
        metadata.remote || false,
        metadata.job_type || [],
        metadata.listed_at || "86400",
        [],
      ] as LinkedInScraperParams,
    };
  }
};

// Core scraping and storage logic
const executeScrapingFlow = async (triggerId: string, scraperType: string) => {
  try {
    const trigger = await prismaClient.trigger.findUnique({
      where: { id: triggerId },
      include: { zap: { include: { zapRuns: true } } },
    });

    if (!trigger || !trigger.metadata?.hasOwnProperty("keywords")) {
      console.warn(`Trigger ${triggerId} not found or invalid type`);
      return [];
    }

    // const scraperType = trigger.metadata?.type? || "INDEED_JOBS"; // Default to indeed
    const { scraper, params } = getScraperParams(trigger, scraperType);

    const jobs = await scraper(...params);

    if (jobs.length === 0) {
      console.info(`No new jobs found for trigger ${triggerId}`);
      return [];
    }

    const resp = await prismaClient.$transaction(async (tx: PrismaTransactionalClient) => {
      const existingRun = await tx.zapRun.findFirst({
        where: {
          zapId: trigger.zapId,
          metadata: {
            path: ["type"],
            equals: scraperType,
          },
        },
        orderBy: { id: "desc" },
        take: 1,
      });

      let run: { id: string; zapId: string; metadata: Prisma.JsonValue };
      if (existingRun) {
        const existingMetadata = existingRun.metadata as any;
        const updatedJobs = [...jobs, ...(existingMetadata.jobs || [])];
        run = await tx.zapRun.update({
          where: { id: existingRun.id },
          data: {
            metadata: {
              ...existingMetadata,
              jobs: updatedJobs,
              lastUpdated: new Date().toISOString(),
            },
          },
        });
      } else {
        run = await tx.zapRun.create({
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

      if (run.id !== "") {
        await tx.zapRunOutbox.create({
          data: { zapRunId: run.id },
        });
      }

      return { run }
    });

    console.info(`Successfully processed trigger ${triggerId}`, {
      jobCount: jobs.length,
    });
    return jobs;
  } catch (error) {
    console.error(`Error processing trigger ${triggerId}`, { error });
    throw error;
  }
};

// POST route to handle job search requests
app.post("/schedule", async (req, res) => {
  const { triggerId, scraperType, userId } = req.body;
  try {
    if (!triggerId || !userId) {
      throw new Error("Missing triggerId or userId");
    }

    const intervalHours = 10;
    const nextRunAt = new Date(Date.now() + intervalHours * 60 * 60 * 1000);

    await prismaClient.$transaction(async (tx: PrismaTransactionalClient) => {
      const existingSchedule = await tx.jobSchedule.findFirst({
        where: { triggerId, userId },
      });

      if (existingSchedule) {
        await tx.jobSchedule.update({
          where: { id: existingSchedule.id },
          data: {
            isActive: true,
            interval: intervalHours,
            nextRunAt,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.jobSchedule.create({
          data: {
            triggerId,
            userId,
            interval: intervalHours,
            nextRunAt,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    });

    const job_list = await executeScrapingFlow(triggerId, scraperType);
    res.json({ success: true, jobs: job_list });
  } catch (error) {
    console.error("Scheduling error", { error, triggerId, userId });
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

function isObjectWithType(value: any): value is { type: string } {
  return value !== null && typeof value === "object" && "type" in value;
}

// Background worker to check for due jobs
const startScheduler = async () => {
  const CHECK_INTERVAL = 10 * 60 * 60 * 1000; // 10 hours
  setInterval(async () => {
    const now = new Date();
    const thresholdHours = 48;
    const oldestAllowed = new Date(
      now.getTime() - thresholdHours * 60 * 60 * 1000,
    );

    try {
      const dueJobs = await prismaClient.jobSchedule.findMany({
        where: {
          nextRunAt: { lte: now, gte: oldestAllowed },
          isActive: true,
        },
        include: { trigger: true },
        orderBy: { updatedAt: "desc" },
        distinct: ["triggerId"],
      });

      console.info("Checking for due jobs", { jobCount: dueJobs.length });

      for (const job of dueJobs) {
        try {
          const scraperType = isObjectWithType(job.trigger.metadata)
            ? job.trigger.metadata.type
            : "";
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
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Delay to prevent overload
        } catch (error) {
          console.error(`Error processing job ${job.id}`, { error });
        }
      }
    } catch (error) {
      console.error("Scheduler error", { error });
    }
  }, CHECK_INTERVAL);
};

// Start the scheduler
startScheduler().catch((error) => {
  console.error("Failed to start scheduler", { error });
});

// Start the server
app.listen(5000, () => {
  console.log("Webhook server running on port 5000");
});
