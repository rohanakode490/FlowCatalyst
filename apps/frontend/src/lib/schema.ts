import { z } from "zod";

// Triggers
export const emailTriggerSchema = z.object({
  emailAddress: z.string().email("Invalid email address"),
  subjectFilter: z.string().min(1, "Subject filter is required"),
});

export const solanaTriggerSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required"),
  transactionType: z.enum(["all", "nft", "token"], {
    errorMap: () => ({ message: "Invalid transaction type" }),
  }),
});

// Actions
export const slackActionSchema = z.object({
  channelName: z.string().min(1, "Channel name is required"),
  messageContent: z.string().min(1, "Message content is required"),
});

export const emailActionSchema = z.object({
  recipientEmail: z.string().email("Invalid recipient email"),
  emailSubject: z.string().min(1, "Email subject is required"),
  emailBody: z.string().min(1, "Email body is required"),
});

export const solanaActionSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required"),
  transactionType: z.enum(["all", "nft", "token"], {
    errorMap: () => ({ message: "Invalid transaction type" }),
  }),
});

// Map schemas to trigger/action names
export const TRIGGER_SCHEMAS: Record<string, z.ZodSchema<any>> = {
  email: emailTriggerSchema,
  solana: solanaTriggerSchema,
};

export const ACTION_SCHEMAS: Record<string, z.ZodSchema<any>> = {
  slack: slackActionSchema,
  email: emailActionSchema,
  solana: solanaActionSchema,
};
