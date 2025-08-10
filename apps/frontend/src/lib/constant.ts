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
  linkedintrigger: [
    {
      type: "tag-input",
      label: "Keywords",
      name: "keywords",
      placeholder: "Add keywords...",
      required: true,
    },
    {
      type: "country-state",
      label: "country",
      name: "country",
      placeholder: "Enter location (e.g., India)",
      required: true,
    },
    {
      type: "multi-select",
      label: "Experience Level",
      name: "experience",
      options: [
        { value: "1", label: "Internship" },
        { value: "2", label: "Entry Level" },
        { value: "3", label: "Associate" },
        { value: "4", label: "Mid-Senior Level" },
        { value: "5", label: "Director" },
        { value: "6", label: "Executive" },
      ],
      required: false,
    },
    {
      type: "multi-select",
      label: "Remote/Onsite/Hybrid",
      name: "remote",
      options: [
        { value: "1", label: "Onsite" },
        { value: "2", label: "Remote" },
        { value: "3", label: "Hybrid" },
      ],
      required: false,
    },
    {
      type: "multi-select",
      label: "Job Type",
      name: "job_type",
      options: [
        { value: "F", label: "Full-time" },
        { value: "C", label: "Contract" },
        { value: "P", label: "Part-time" },
        { value: "T", label: "Temporary" },
        { value: "I", label: "Internship" },
        { value: "V", label: "Volunteer" },
      ],
      required: false,
    },
    {
      type: "select",
      label: "Posted Within",
      name: "listed_at",
      options: [
        { value: "86400", label: "Last 24 Hours" },
        { value: "604800", label: "Last 7 Days" },
        { value: "2592000", label: "Last 30 Days" },
      ],
      required: false,
    },
  ],
  indeedtrigger: [
    {
      type: "tag-input",
      label: "Keywords",
      name: "keywords",
      placeholder: "Add keywords...",
      required: true,
    },
    {
      type: "country-state",
      label: "country",
      name: "country",
      placeholder: "Enter location (e.g., India)",
      required: true,
    },
    {
      type: "multi-select",
      label: "Remote/Onsite/Hybrid",
      name: "remote",
      options: [
        { value: "Onsite", label: "Onsite" },
        { value: "Remote", label: "Remote" },
        { value: "Hybrid", label: "Hybrid" },
      ],
      required: false,
    },
    {
      type: "multi-select",
      label: "Job Type",
      name: "job_type",
      options: [
        { value: "fulltime", label: "Full-time" },
        { value: "contract", label: "Contract" },
        { value: "parttime", label: "Part-time" },
        { value: "temporary", label: "Temporary" },
        { value: "internship", label: "Internship" },
        { value: "volunteer", label: "Volunteer" },
      ],
      required: false,
    },
    {
      type: "select",
      label: "Posted Within",
      name: "listed_at",
      options: [
        { value: "24", label: "Last 24 Hours" },
        { value: "168", label: "Last 7 Days" },
        { value: "720", label: "Last 30 Days" },
      ],
      required: false,
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
      type: "text",
      label: "Amount",
      name: "Amount",
      placeholder: "Enter the amount",
      required: true,
      validation: {
        isNumberOrPlaceholder: true,
      },
    },
  ],
  googlesheets: [
    {
      type: "select",
      label: "Select Sheet",
      name: "sheetid",
      placeholder: "",
      options: [],
      required: true,
    },
    {
      type: "select",
      label: "Sheet Operation",
      name: "sheetOperation", //Add row, col or create new sheet,
      placeholder: "",
      options: [
        { value: "1", label: "Add Row" },
        { value: "2", label: "Add Col" },
        { value: "3", label: "Create a New Sheet" }
      ],
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

export const LINKEDIN_TRIGGER_FIELDS_MAP: Record<string, string[]> = {
  linkedin: [
    "title",
    "company",
    "country",
    "state",
    "company_url",
    "job_link",
    "posted_date",
    "skills",
    "emailBodyTemplate",
  ],
};

export const INDEED_TRIGGER_FIELDS_MAP: Record<string, string[]> = {
  indeed: [
    "title",
    "company",
    "country",
    "state",
    "company_url",
    "job_link",
    "posted_date",
    "skills",
    "emailBodyTemplate",
  ]
};
