import { z } from "zod";

// Triggers
const linkedinJobSchema = z.object({
  keywords: z
    .array(z.string().min(1, "Keyword cannot be empty"))
    .min(1, "At least one keyword is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().optional(),
  experience: z.array(z.string()).optional(),
  remote: z.array(z.string()).optional(),
  job_type: z.array(z.string()).optional(),
  listed_at: z.string().optional(),
});

// Actions
const slackActionSchema = z.object({
  channelName: z.string().min(1, "Channel name is required"),
  messageContent: z.string().min(1, "Message content is required"),
});

const emailActionSchema = z.object({
  recipientEmail: z.string().email("Invalid recipient email"),
  emailSubject: z.string().min(1, "Email subject is required"),
  emailBody: z.string().min(1, "Email body is required"),
});

const solanaActionSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required"),
  Amount: z
    .string()
    .refine(
      (value) =>
        !isNaN(parseFloat(value)) || value.includes("{{trigger.Amount}}"),
      "Amount must be a valid number or contain a placeholder",
    ),
});

// Map schemas to trigger/action names
export const TRIGGER_SCHEMAS: Record<string, z.ZodSchema<any>> = {
  linkedinjobfetchingtrigger: linkedinJobSchema,
};

export const ACTION_SCHEMAS: Record<string, z.ZodSchema<any>> = {
  slack: slackActionSchema,
  email: emailActionSchema,
  solana: solanaActionSchema,
};
