import { z } from "zod";

// Triggers

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
export const TRIGGER_SCHEMAS: Record<string, z.ZodSchema<any>> = {};

export const ACTION_SCHEMAS: Record<string, z.ZodSchema<any>> = {
  slack: slackActionSchema,
  email: emailActionSchema,
  solana: solanaActionSchema,
};
