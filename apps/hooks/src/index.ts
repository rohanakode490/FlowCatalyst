import express, { Request, Response } from "express";
import { Prisma, prismaClient } from "@flowcatalyst/database";
const cron = require("node-cron");
const path = require("path");
const { spawn } = require("child_process");

type PrismaTransactionalClient = Prisma.TransactionClient;

const app = express();
app.use(express.json());

const activeJobs = new Map<string, ReturnType<typeof cron.schedule>>();

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

// function runPythonScraper(
//   keywords: any,
//   location: any,
//   limit: any,
//   offset: any,
//   experience: any,
//   remote: any,
//   job_type: any,
// ) {
//   return new Promise((resolve, reject) => {
//     const scriptPath = path.join(__dirname, "scraper.py");
//
//     // Ensure you're using the correct Python path from venv
//     const pythonCommand =
//       "/mnt/f/Project/FlowCatalyst/apps/hooks/venv/bin/python3";
//
//     console.log(
//       keywords,
//       location,
//       limit,
//       offset,
//       experience,
//       remote,
//       job_type,
//     );
//     const pythonProcess = spawn(pythonCommand, [
//       scriptPath,
//       keywords,
//       location,
//       limit,
//       offset,
//       experience || "[]",
//       remote || "[]",
//       job_type || "[]",
//     ]);
//
//     let jobs = "";
//
//     pythonProcess.stdout.on("data", (data: any) => {
//       console.log("Python Output:", data.toString());
//       jobs += data.toString();
//     });
//
//     pythonProcess.stderr.on("data", (data: any) => {
//       console.error(`Error from Python script: ${data}`);
//       reject(data.toString());
//     });
//
//     pythonProcess.on("close", (code: any) => {
//       console.log("jobs", jobs);
//       if (code === 0) {
//         try {
//           resolve(JSON.parse(jobs));
//         } catch (error) {
//           reject("Failed to parse Python output");
//         }
//       } else {
//         reject(`Python script exited with code ${code}`);
//       }
//     });
//   });
// }
//

// Python scraper execution
const runPythonScraper = (
  keywords: string[],
  location: string,
  limit: number,
  offset: number,
  experience: string[],
  remote: boolean,
  jobType: string[],
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "scraper.py");
    const pythonCommand =
      "/mnt/f/Project/FlowCatalyst/apps/hooks/venv/bin/python3";

    const keywords_list = keywords.join(" OR ");
    const args = [
      scriptPath,
      keywords_list,
      location,
      limit,
      offset,
      JSON.stringify(experience),
      JSON.stringify(remote),
      JSON.stringify(jobType),
    ];

    console.log("args", args);

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

// Core scraping and storage logic
const executeScrapingFlow = async (triggerId: string) => {
  try {
    // Always fetch fresh parameters
    const trigger: any = await prismaClient.trigger.findUnique({
      where: { id: triggerId },
      // include: { zap: true },
    });

    if (!trigger || !trigger.metadata?.hasOwnProperty("keywords")) {
      console.log(`Trigger ${triggerId} not found or invalid type`);
      return;
    }
    console.log(
      "trigg",
      trigger,
      typeof trigger.metadata,
      trigger.metadata.hasOwnProperty("keywords"),
    );

    let location =
      trigger.metadata?.state === ""
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
    );

    // Store results
    await prismaClient.$transaction(async (tx: PrismaTransactionalClient) => {
      const run = await tx.zapRun.create({
        data: {
          zapId: trigger.zapId,
          metadata: {
            type: "LINKEDIN_JOBS",
            jobs,
            scrapedAt: new Date().toISOString(),
          },
        },
      });

      await tx.zapRunOutbox.create({
        data: { zapRunId: run.id },
      });
    });

    console.log(`Successfully processed trigger ${triggerId}`);
    return jobs;
  } catch (error: any) {
    console.error(`Error processing trigger ${triggerId}:`, error);
    throw new Error(error);
  }
};

// POST route to handle job search requests
app.post("/schedule", async (req, res) => {
  const { triggerId } = req.body;

  try {
    // Cancel existing job if present
    const existingJob = activeJobs.get(triggerId);
    if (existingJob) {
      existingJob.stop();
    }

    // Create new cron job (every 10 hours)
    const job = cron.schedule("0 */10 * * *", () =>
      executeScrapingFlow(triggerId),
    );
    activeJobs.set(triggerId, job);

    // Immediate first run
    const job_list = await executeScrapingFlow(triggerId);

    res.json({ success: true, job: job_list });
  } catch (error) {
    console.error("Scheduling error:", error);
    res.status(500).json({ success: false, error: "Failed to schedule job" });
  }
});

// Schedule job search every 10 hours
// cron.schedule("0 */10 * * *", async () => {
//   console.log("Running job search...");
//   try {
//     const jobs = await searchLinkedInJobs("software engineer", "United States");
//     console.log("Jobs fetched:", jobs);
//   } catch (error) {
//     console.error("Error during scheduled job search:", error);
//   }
// });

// Start the server
app.listen(5000, () => {
  console.log("Webhook server running on port 5000");
});
