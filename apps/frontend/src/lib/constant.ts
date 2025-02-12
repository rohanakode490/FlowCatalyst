import Category from "@/components/icons/category";
import Settings from "@/components/icons/settings";
import Workflows from "@/components/icons/workflows";
import { FormField } from "./types";

export const Integrations = [...new Array(3)].map((_, index) => ({
  href: `/${index + 1}.png`,
}));

export const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Documentation" },
];

export const menuOptions = [
  { name: "Workflows", Component: Workflows, href: "/workflows" },
  { name: "Settings", Component: Settings, href: "/settings" },
  { name: "Connections", Component: Category, href: "/connections" },
];

export const TRIGGER_FORM_FIELDS: Record<string, FormField[]> = {
  // emailtrigger: [
  //   {
  //     type: "text",
  //     label: "Email Address",
  //     name: "emailAddress",
  //     placeholder: "Enter your email address",
  //     required: true,
  //   },
  //   {
  //     type: "password",
  //     label: "Password",
  //     name: "password",
  //     placeholder: "Enter your email password",
  //     required: true,
  //   },
  // ],
  githubtrigger: [
    {
      type: "select",
      label: "GitHub Event Type",
      name: "githubEventType",
      options: [
        { value: "issue_comment", label: "Issue Comment" },
        { value: "pull_request", label: "Pull Request" },
        { value: "issues", label: "Issues" },
      ],
      required: true,
    },
    {
      type: "readonly-link",
      name: "githubwebhook",
      label: "GitHub Webhook URL",
      value: "hooks/github",
      description:
        "Copy this URL and paste it into the Payload URL field in your GitHub repository's webhook settings. Ensure you select the events you want to trigger this workflow (e.g., issue_comment, push). ",
      docsLink: "/docs/github-webhook",
    },
  ],
};

export const ACTION_FORM_FIELDS: Record<string, FormField[]> = {
  slack: [
    {
      type: "text",
      label: "Channel Name",
      name: "channelName",
      placeholder: "Enter the Slack channel name",
      required: true,
    },
    {
      type: "text",
      label: "Message Content",
      name: "messageContent",
      placeholder: "Enter the message to send",
      required: true,
    },
  ],
  email: [
    {
      type: "text",
      label: "Recipient Email",
      name: "recipientEmail",
      placeholder: "Enter the recipient's email address",
      required: true,
    },
    {
      type: "text",
      label: "Email Subject",
      name: "emailSubject",
      placeholder: "Enter the email subject",
      required: true,
    },
    {
      type: "text",
      label: "Email Body",
      name: "emailBody",
      placeholder: "Enter the email body",
      required: true,
    },
  ],
  solana: [
    {
      type: "text",
      label: "Wallet Address",
      name: "walletAddress",
      placeholder: "Enter the wallet address to monitor",
      required: true,
    },
    {
      type: "number",
      label: "Amount",
      name: "Amount",
      required: true,
    },
  ],
};

export const GITHUB_TRIGGER_FIELDS_MAP: Record<string, string[]> = {
  issue_comment: [
    "user",
    "issue_url",
    "issue_title",
    "Amount",
    "ToSolanaAddress",
  ],
  pull_request: ["user", "pullRequest_url", "pullRequest_title"],
  issues: ["user", "issue_url", "issue_title"],
};
