import { Request, Response } from "express";
import { prismaClient } from "@flowcatalyst/database";
import { runZap } from "../engine/executor";

export type EventData = {
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

export const handlePullRequestEvent = (payload: any): EventData | null => {
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

export const handleIssueCommentEvent = (payload: any): EventData | null => {
  const { action, issue, comment, sender } = payload;
  const bountyRegex = /bounty:\s*{([^}]+)}/;
  const match = comment.body.match(bountyRegex);
  const isBounty = !!match;

  if (
    !isBounty ||
    action !== "created" ||
    (comment.author_association !== "MEMBER" &&
      comment.author_association !== "OWNER")
  ) {
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

    if (
      typeof bountyData.FromSolanaAddress === "string" &&
      typeof bountyData.ToSolanaAddress === "string" &&
      typeof bountyData.Amount === "number"
    ) {
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

export const handleIssuesEvent = (payload: any): EventData | null => {
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

export const handleGitHubWebhook = async (
  req: Request,
  res: Response,
  eventType: string,
) => {
  const zapId = req.params.zapId;
  const payload = req.body;

  try {
    let eventData: EventData | null = null;
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

    if (eventData) {
      const run = await prismaClient.zapRun.create({
        data: {
          zapId: zapId,
          metadata: eventData,
        },
      });

      // Directly trigger execution
      runZap(run.id).catch((err) =>
        console.error("Error in async runZap:", err),
      );

      res.json({ message: "Webhook received and execution started" });
    } else {
      res.json({
        message: "Webhook received but not processed (condition not met)",
      });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error });
  }
};
