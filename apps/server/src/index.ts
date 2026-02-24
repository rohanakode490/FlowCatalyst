import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { Prisma, prismaClient } from "@flowcatalyst/database";
import path from "path";
import { spawn } from "child_process";

// Engine imports
import { parseDynamicFields } from "./engine/parser";
import { sendEmail } from "./engine/email";
import { transferSOL } from "./engine/solana";
import { loadTemplate, renderTemplate } from "./engine/templateLoader";
import {
  appendColumnToSheet,
  appendRowToSheet,
  createSheet,
  getGoogleAccessToken,
} from "./engine/googlesheets";

dotenv.config();

const app = express();
app.use(express.json());

type PrismaTransactionalClient = Prisma.TransactionClient;

const parseJson = (data: any, fallback: any = {}) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || fallback;
  } catch (error) {
    console.error("JSON parsing failed:", error);
    return fallback;
  }
};

/**
 * Core Execution Engine (replaced Kafka)
 */
async function runZap(zapRunId: string) {
  console.log(`Starting Zap execution for run: ${zapRunId}`);

  try {
    const zapRunDetails = await prismaClient.zapRun.findFirst({
      where: { id: zapRunId },
      include: {
        zap: {
          include: {
            actions: {
              include: { type: true },
              orderBy: { sortingOrder: "asc" },
            },
          },
        },
      },
    });

    if (!zapRunDetails) {
      console.error(`ZapRun ${zapRunId} not found`);
      return;
    }

    const dynamicFieldsVal = zapRunDetails.metadata;
    const actions = zapRunDetails.zap.actions;

    for (const currentAction of actions) {
      console.log(`Executing stage ${currentAction.sortingOrder}: ${currentAction.type.name}`);

      if (currentAction.type.name === "Email") {
        try {
          const emailMetadata = parseJson(currentAction.metadata);
          const dynamicFields = parseJson(dynamicFieldsVal);

          if (!emailMetadata?.recipientEmail || !emailMetadata?.emailSubject) {
            throw new Error("Missing required email fields");
          }

          const to = emailMetadata.recipientEmail;
          let subject = emailMetadata.emailSubject;
          let emailBody = emailMetadata.emailBody;

          const containsTriggerPlaceholders =
            subject.includes("{{trigger.") || emailBody.includes("{{trigger.");

          if (containsTriggerPlaceholders && dynamicFields.jobs && Array.isArray(dynamicFields.jobs)) {
            if (subject.includes("{{trigger.")) {
              subject = dynamicFields.jobs.map((job: any) => parseDynamicFields(subject, { trigger: job })).join(", ");
            }

            if (emailBody.includes("{{trigger.emailBodyTemplate}}")) {
              const template = loadTemplate("emailTemplate");
              const renderedTemplate = renderTemplate(template, dynamicFields.jobs);
              emailBody = emailBody.replace("{{trigger.emailBodyTemplate}}", renderedTemplate);
            }

            if (emailBody.includes("{{trigger.")) {
              emailBody = dynamicFields.jobs.map((job: any) => parseDynamicFields(emailBody, { trigger: job })).join("</br>");
            }
          } else {
            subject = parseDynamicFields(subject, dynamicFields);
            emailBody = parseDynamicFields(emailBody, dynamicFields);
          }

          await sendEmail({ to, subject, body: emailBody });
          console.log("✅ Email sent successfully");
        } catch (error: any) {
          console.error("Failed to process email action:", error.message);
        }
      } else if (currentAction.type.name === "Solana") {
        try {
          const SolanaData = parseDynamicFields(
            parseJson(currentAction.metadata),
            parseJson(dynamicFieldsVal)
          );
          await transferSOL(SolanaData.ToSolanaAddress, SolanaData.Amount);
          console.log("✅ Solana transfer completed");
        } catch (error: any) {
          console.error("Failed to process Solana action:", error.message);
        }
      } else if (currentAction.type.name === "Google Sheets") {
        try {
          const sheetsMetadata = parseJson(currentAction.metadata);
          const dynamicFields = parseJson(dynamicFieldsVal);

          if (!sheetsMetadata.refreshToken || !sheetsMetadata.sheetid || !sheetsMetadata.sheetOperation) {
            throw new Error("Missing required Google Sheets fields");
          }

          const accessToken = await getGoogleAccessToken(sheetsMetadata.refreshToken);
          const sheetName = sheetsMetadata.sheetName || "Sheet1";

          if (sheetsMetadata.sheetOperation === "1") {
            const data = Array.isArray(dynamicFields.jobs) ? dynamicFields.jobs : [dynamicFields.jobs || ""];
            await appendRowToSheet(accessToken, sheetsMetadata.sheetid, sheetName, data, dynamicFields);
          } else if (sheetsMetadata.sheetOperation === "2") {
            const data = Array.isArray(dynamicFields.jobs) ? dynamicFields.jobs : [dynamicFields.jobs || ""];
            await appendColumnToSheet(accessToken, sheetsMetadata.sheetid, data, dynamicFields);
          } else if (sheetsMetadata.sheetOperation === "3") {
            const data = Array.isArray(dynamicFields.jobs) ? dynamicFields.jobs : [dynamicFields.jobs || ""];
            await createSheet(accessToken, sheetsMetadata.sheetid, sheetName, data);
          }
          console.log("✅ Google Sheets operation completed");
        } catch (error: any) {
          console.error("Failed to process Google Sheets action:", error.message);
        }
      }
      
      // Artificial delay between actions if needed
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`✅ Zap execution finished for run: ${zapRunId}`);
  } catch (error) {
    console.error(`Error executing ZapRun ${zapRunId}:`, error);
  }
}

/**
 * Webhook and Scraper Logic (from hooks)
 */

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

const handlePullRequestEvent = (payload: any): EventData | null => {
  const { action, pull_request, sender } = payload;
  if (action !== "opened") return null;
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
  const bountyRegex = /bounty:\s*{([^}]+)}/;
  const match = comment.body.match(bountyRegex);
  const isBounty = !!match;

  if (!isBounty || action !== "created" || (comment.author_association !== "MEMBER" && comment.author_association !== "OWNER")) {
    return null;
  }

  const eventData: EventData = {
    eventType: "issue_comment",
    action,
    user: sender.login,
    issue_title: issue.title,
    issue_url: issue.html_url,
  };

  try {
    const bountyContent = match[1];
    const flexibleJson = bountyContent
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ': "$1"');

    const bountyData = JSON.parse(`{${flexibleJson}}`);

    if (typeof bountyData.FromSolanaAddress === "string" && typeof bountyData.ToSolanaAddress === "string" && typeof bountyData.Amount === "number") {
      eventData.FromSolanaAddress = bountyData.FromSolanaAddress;
      eventData.ToSolanaAddress = bountyData.ToSolanaAddress;
      eventData.Amount = bountyData.Amount;
      eventData.eventType = "bounty";
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
  if (action !== "opened") return null;
  return {
    eventType: "issues",
    action,
    user: sender.login,
    issue_title: issue.title,
    issue_url: issue.html_url,
  };
};

const handleGitHubWebhook = async (req: Request, res: Response, eventType: string) => {
  const zapId = req.params.zapId;
  const payload = req.body;

  try {
    let eventData: EventData | null = null;
    switch (eventType) {
      case "pull_request": eventData = handlePullRequestEvent(payload); break;
      case "issue_comment": eventData = handleIssueCommentEvent(payload); break;
      case "issues": eventData = handleIssuesEvent(payload); break;
      default: throw new Error(`Unsupported event type: ${eventType}`);
    }

    if (eventData) {
      const run = await prismaClient.zapRun.create({
        data: {
          zapId: zapId,
          metadata: eventData,
        },
      });

      // Directly trigger execution
      runZap(run.id).catch(err => console.error("Error in async runZap:", err));

      res.json({ message: "Webhook received and execution started" });
    } else {
      res.json({ message: "Webhook received but not processed (condition not met)" });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error });
  }
};

app.post("/github-webhook/:eventType/:userId/:zapId", (req: Request, res: Response) => {
  handleGitHubWebhook(req, res, req.params.eventType);
});

// Scrapers
const runLinkedinScraper = (keywords: string[], location: string, limit: number, offset: number, experience: string[], remote: boolean, jobType: string[], listed_at: string, existingUrns: string[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "linkedin-scraper", "linkedin-scraper.py");
    const pythonCommand = process.env.VIRTUAL_ENV ? `${process.env.VIRTUAL_ENV}/bin/python` : "python";
    const args = [scriptPath, keywords.join(" OR ") || "", location, limit.toString(), offset.toString(), JSON.stringify(experience), JSON.stringify(remote), JSON.stringify(jobType), listed_at, JSON.stringify(existingUrns)];
    const pythonProcess = spawn(pythonCommand, args);
    let output = "";
    pythonProcess.stdout.on("data", (data) => output += data.toString());
    pythonProcess.stderr.on("data", (data) => console.error(`Python error: ${data}`));
    pythonProcess.on("close", (code) => {
      if (code === 0) { try { resolve(JSON.parse(output)); } catch (e) { reject("Failed to parse Python output"); } }
      else reject(`Python script exited with code ${code}`);
    });
  });
};

const runIndeedScraper = (searchTerm: string, location: string, country: string, resultsWanted: number, isRemote: boolean, jobType: string, hoursOld: number): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "indeed-scraper", "indeed-scraper.py");
    const pythonCommand = process.env.VIRTUAL_ENV ? `${process.env.VIRTUAL_ENV}/bin/python` : "python3";
    const args = [scriptPath, searchTerm, location, country, resultsWanted.toString(), isRemote.toString(), jobType, hoursOld.toString()];
    const pythonProcess = spawn(pythonCommand, args);
    let output = "";
    pythonProcess.stdout.on("data", (data) => output += data.toString());
    pythonProcess.stderr.on("data", (data) => {});
    pythonProcess.on("close", (code) => {
      if (code === 0) { try { resolve(JSON.parse(output)); } catch (e) { reject("Failed to parse Python output"); } }
      else reject(`Python script exited with code ${code}`);
    });
  });
};

const executeScrapingFlow = async (triggerId: string, scraperType: string) => {
  try {
    const trigger = await prismaClient.trigger.findUnique({
      where: { id: triggerId },
      include: { zap: true },
    });

    if (!trigger || !trigger.metadata) return [];
    
    const metadata = trigger.metadata as any;
    const location = metadata.state ? `${metadata.state}, ${metadata.country || "USA"}` : metadata.country || "USA";
    
    let jobs: any[] = [];
    if (scraperType === "INDEED_JOBS") {
      jobs = await runIndeedScraper(metadata.keywords?.join(" OR ") || "", location, metadata.country || "USA", metadata.limit || 10, metadata.is_remote || false, metadata.job_type || "", metadata.hours_old || 168);
    } else if (scraperType === "LINKEDIN_JOBS") {
      jobs = await runLinkedinScraper(metadata.keywords || [], location, metadata.limit || 10, 0, metadata.experience || [], metadata.remote || false, metadata.job_type || [], metadata.listed_at || "86400", []);
    }

    if (jobs.length === 0) return [];

    const run = await prismaClient.$transaction(async (tx) => {
      const existingRun = await tx.zapRun.findFirst({
        where: { zapId: trigger.zapId, metadata: { path: ["type"], equals: scraperType } },
        orderBy: { id: "desc" },
      });

      if (existingRun) {
        const existingMetadata = existingRun.metadata as any;
        return await tx.zapRun.update({
          where: { id: existingRun.id },
          data: { metadata: { ...existingMetadata, jobs: [...jobs, ...(existingMetadata.jobs || [])], lastUpdated: new Date().toISOString() } },
        });
      } else {
        return await tx.zapRun.create({
          data: { zapId: trigger.zapId, metadata: { type: scraperType, jobs, scrapedAt: new Date().toISOString() } },
        });
      }
    });

    runZap(run.id).catch(err => console.error("Error in async runZap from scraper:", err));
    return jobs;
  } catch (error) {
    console.error(`Error processing scraper trigger ${triggerId}:`, error);
    throw error;
  }
};

app.post("/schedule", async (req, res) => {
  const { triggerId, scraperType, userId } = req.body;
  try {
    const nextRunAt = new Date(Date.now() + 10 * 60 * 60 * 1000);
    await prismaClient.jobSchedule.upsert({
      where: { id: (await prismaClient.jobSchedule.findFirst({ where: { triggerId, userId } }))?.id || 'new' },
      update: { isActive: true, nextRunAt, updatedAt: new Date() },
      create: { triggerId, userId, interval: 10, nextRunAt }
    });
    const jobs = await executeScrapingFlow(triggerId, scraperType);
    res.json({ success: true, jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const startScheduler = async () => {
  setInterval(async () => {
    const now = new Date();
    try {
      const dueJobs = await prismaClient.jobSchedule.findMany({
        where: { nextRunAt: { lte: now }, isActive: true },
        include: { trigger: true },
      });
      for (const job of dueJobs) {
        const scraperType = (job.trigger.metadata as any)?.type || "";
        await executeScrapingFlow(job.triggerId, scraperType);
        await prismaClient.jobSchedule.update({
          where: { id: job.id },
          data: { nextRunAt: new Date(now.getTime() + job.interval * 60 * 60 * 1000), updatedAt: now }
        });
      }
    } catch (e) { console.error("Scheduler error:", e); }
  }, 10 * 60 * 60 * 1000);
};

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

startScheduler();
app.listen(5000, () => console.log("Combined server running on port 5000"));
