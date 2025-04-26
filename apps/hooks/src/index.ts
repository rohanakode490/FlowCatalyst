import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { Prisma, prismaClient } from "@flowcatalyst/database";
const path = require("path");
const { spawn } = require("child_process");

dotenv.config();

type PrismaTransactionalClient = Prisma.TransactionClient;

const app = express();
app.use(express.json());

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

// Python scraper execution
const runPythonScraper = (
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
    const scriptPath = path.join(__dirname, "scraper.py");
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

    // console.log("args", args);

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

// Helper function to efficiently get recent URNs from database
// async function getRecentJobUrns(
//   zapId: string,
//   limit: number = 10,
// ): Promise<string[]> {
//   // Fetch the most recent ZapRuns for this Zap
//   const recentRuns = await prismaClient.zapRun.findMany({
//     where: {
//       zapId,
//       metadata: {
//         path: ["type"],
//         equals: "LINKEDIN_JOBS",
//       },
//     },
//     orderBy: {
//       // Assuming ZapRun has a createdAt field, otherwise use another appropriate field
//       // If there's no timestamp field, we might need a different approach
//       id: "desc",
//     },
//     take: limit, // Limit to most recent runs
//     select: {
//       metadata: true,
//     },
//   });
//
//   // Extract and flatten URNs from all recent runs
//   const allUrns: string[] = [];
//
//   for (const run of recentRuns) {
//     const metadata = run.metadata as any;
//     if (metadata.jobs && Array.isArray(metadata.jobs)) {
//       const runUrns = metadata.jobs.map((job: any) => job.urn).filter(Boolean);
//       allUrns.push(...runUrns);
//     }
//   }
//
//   // Remove duplicates and return
//   return [...new Set(allUrns)];
// }

// Core scraping and storage logic
const executeScrapingFlow = async (triggerId: string) => {
  try {
    // Always fetch fresh parameters
    const trigger: any = await prismaClient.trigger.findUnique({
      where: { id: triggerId },
      include: {
        zap: {
          include: {
            zapRuns: true,
          },
        },
      },
    });
    if (!trigger || !trigger.metadata?.hasOwnProperty("keywords")) {
      console.log(`Trigger ${triggerId} not found or invalid type`);
      return [];
    }

    //Getting urn(s)
    // Get existing URNs efficiently
    // const existingUrns = await getRecentJobUrns(trigger.zapId);

    if (!trigger || !trigger.metadata?.hasOwnProperty("keywords")) {
      console.log(`Trigger ${triggerId} not found or invalid type`);
      return;
    }

    let location =
      trigger.metadata?.state === undefined || trigger.metadata.state === ""
        ? `${trigger.metadata?.country}`
        : `${trigger.metadata?.state}, ${trigger.metadata?.country}`;

    // Execute Python scraper
    const jobs = await runPythonScraper(
      trigger.metadata?.keywords,
      location,
      trigger.metadata?.limit || 10,
      0,
      trigger.metadata.experience || "",
      trigger.metadata.remote || "",
      trigger.metadata.job_type || "",
      trigger.metadata.listed_at || "86400",
      [],
      // existingUrns || [],
    );
    if (jobs.length === 0) {
      console.log(`No new jobs found for trigger ${triggerId}`);
      return [];
    }

    // // Store results
    // await prismaClient.$transaction(async (tx: PrismaTransactionalClient) => {
    //   const run = await tx.zapRun.create({
    //     data: {
    //       zapId: trigger.zapId,
    //       metadata: {
    //         type: "LINKEDIN_JOBS",
    //         jobs,
    //         scrapedAt: new Date().toISOString(),
    //       },
    //     },
    //   });
    //
    //   await tx.zapRunOutbox.create({
    //     data: { zapRunId: run.id },
    //   });
    // });
    // Store results in a transaction
    await prismaClient.$transaction(async (tx: PrismaTransactionalClient) => {
      // Check if we can update an existing ZapRun instead of creating a new one
      const existingRun = await tx.zapRun.findFirst({
        where: {
          zapId: trigger.zapId,
          metadata: {
            path: ["type"],
            equals: "LINKEDIN_JOBS",
          },
        },
        orderBy: { id: "desc" },
        take: 1,
      });

      let run: { id: string; zapId: string; metadata: Prisma.JsonValue } = {
        id: "",
        zapId: "",
        metadata: {},
      };
      if (existingRun) {
        // Update existing ZapRun if it's recent
        const existingMetadata = existingRun.metadata as any;
        const updatedJobs = [...jobs, ...(existingMetadata.jobs || [])];

        // Update the existing record with new jobs
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
        // Create new ZapRun if no recent one exists
        run = await tx.zapRun.create({
          data: {
            zapId: trigger.zapId,
            metadata: {
              type: "LINKEDIN_JOBS",
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
    });
    console.log(`Successfully processed trigger ${triggerId}`);
    return jobs;
  } catch (error) {
    console.error(`Error processing trigger ${triggerId}:`, error);
    throw error;
  }
};

// POST route to handle job search requests
app.post("/schedule", async (req, res) => {
  const { triggerId, userId } = req.body;
  try {
    const intervalHours = 10;

    // Find or create schedule
    const existingSchedule = await prismaClient.jobSchedule.findFirst({
      where: {
        triggerId,
        userId,
      },
    });

    if (existingSchedule) {
      await prismaClient.jobSchedule.update({
        where: { id: existingSchedule.id },
        data: {
          isActive: true,
          interval: intervalHours,
          nextRunAt: new Date(Date.now() + intervalHours * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      });
    } else {
      await prismaClient.jobSchedule.create({
        data: {
          triggerId,
          userId,
          interval: intervalHours,
          nextRunAt: new Date(Date.now() + intervalHours * 60 * 60 * 1000),
        },
      });
    }

    // Immediate first run
    const job_list = await executeScrapingFlow(triggerId);

    // console.log("job_list", job_list);
    res.json({ success: true, job: job_list });
  } catch (error) {
    console.error("Scheduling error:", error);
    res.status(500).json({ success: false, error: "Failed to schedule job" });
  }
});

// Background worker to check for due jobs
const startScheduler = async () => {
  const now = new Date();
  const thresholdHours = 48; // Process jobs up to 48 hours old
  const oldestAllowed = new Date(
    now.getTime() - thresholdHours * 60 * 60 * 1000,
  );
  const CHECK_INTERVAL = 10 * 60 * 60 * 1000;
  setInterval(async () => {
    const dueJobs = await prismaClient.jobSchedule.findMany({
      where: {
        nextRunAt: {
          lte: now, // Due now or earlier
          gte: oldestAllowed, // But not older than threshold
        },
        isActive: true,
      },
      include: {
        trigger: true,
      },
      // Prevent multiple jobs per trigger
      orderBy: { updatedAt: "desc" },
      distinct: ["triggerId"],
    });
    console.log("checking...", dueJobs);

    for (const job of dueJobs) {
      try {
        // const jobs = await executeScrapingFlow(job.triggerId);

        // Update next run time
        await prismaClient.jobSchedule.update({
          where: { id: job.id },
          data: {
            nextRunAt: new Date(now.getTime() + job.interval * 60 * 60 * 1000),
            updatedAt: now,
          },
        });

        // Execute the job
        await executeScrapingFlow(job.triggerId);

        // Small delay between jobs to prevent system overload
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
      }
    }
  }, CHECK_INTERVAL); // Check every 10 hours
};

// Start the scheduler
startScheduler().catch((error) => {
  console.error("Failed to start scheduler:", error);
});

// Start the server
app.listen(5000, () => {
  console.log("Webhook server running on port 5000");
});
