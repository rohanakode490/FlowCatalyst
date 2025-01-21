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
  emailtrigger: [
    {
      type: "text",
      label: "Email Address",
      name: "emailAddress",
      placeholder: "Enter your email address",
      required: true,
    },
    {
      type: "password",
      label: "Password",
      name: "password",
      placeholder: "Enter your email password",
      required: true,
    },
  ],
  githubtrigger: [
    {
      type: "text",
      name: "username",
      label: "GitHub Username",
      placeholder: "Enter your GitHub username",
      required: true,
    },
    {
      type: "text",
      name: "repository",
      label: "Repository",
      placeholder: "Enter the repository name (e.g., owner/repo)",
      required: false,
    },
    {
      type: "select",
      name: "event",
      label: "Event Type",
      options: [
        { value: "Issue_comment", label: "Issue Comment" },
        { value: "Push", label: "Push" },
        { value: "Bounty", label: "Bounty" },
      ],
      required: true,
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
      type: "select",
      label: "Transaction Type",
      name: "transactionType",
      options: [
        { value: "all", label: "All Transactions" },
        { value: "nft", label: "NFT Transactions" },
        { value: "token", label: "Token Transfers" },
      ],
      required: true,
    },
  ],
};
