import express, { Request, Response } from "express";

import { Prisma, prismaClient } from "@flowcatalyst/database";

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
      error: error instanceof Error ? error.message : "Internal server error",
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

// Start the server
app.listen(5000, () => {
  console.log("Webhook server running on port 5000");
});
