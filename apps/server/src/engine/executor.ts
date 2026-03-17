import dotenv from "dotenv";

dotenv.config();
import { prismaClient } from "@flowcatalyst/database";
import { parseDynamicFields } from "./utils/parser";
import { sendEmail } from "./actions/email";
import { transferSOL } from "./actions/solana";
import { loadTemplate, renderTemplate } from "./utils/templateLoader";
import {
  appendColumnToSheet,
  appendRowToSheet,
  createSheet,
  getGoogleAccessToken,
} from "./actions/googlesheets";

const parseJson = (data: any, fallback: any = {}) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || fallback;
  } catch (error) {
    console.error("JSON parsing failed:", error);
    return fallback;
  }
};

/**
 * Core Execution Engine
 */
export async function runZap(zapRunId: string) {
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
      console.log(
        `Executing stage ${currentAction.sortingOrder}: ${currentAction.type.name}`,
      );

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

          if (
            containsTriggerPlaceholders &&
            dynamicFields.jobs &&
            Array.isArray(dynamicFields.jobs)
          ) {
            if (subject.includes("{{trigger.")) {
              subject = dynamicFields.jobs
                .map((job: any) =>
                  parseDynamicFields(subject, { trigger: job }),
                )
                .join(", ");
            }

            if (emailBody.includes("{{trigger.emailBodyTemplate}}")) {
              const template = loadTemplate("emailTemplate");
              const renderedTemplate = renderTemplate(
                template,
                dynamicFields.jobs,
              );
              emailBody = emailBody.replace(
                "{{trigger.emailBodyTemplate}}",
                renderedTemplate,
              );
            }

            if (emailBody.includes("{{trigger.")) {
              emailBody = dynamicFields.jobs
                .map((job: any) =>
                  parseDynamicFields(emailBody, { trigger: job }),
                )
                .join("</br>");
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
            parseJson(dynamicFieldsVal),
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

          if (
            !sheetsMetadata.refreshToken ||
            !sheetsMetadata.sheetid ||
            !sheetsMetadata.sheetOperation
          ) {
            throw new Error("Missing required Google Sheets fields");
          }

          const accessToken = await getGoogleAccessToken(
            sheetsMetadata.refreshToken,
          );
          const sheetName = sheetsMetadata.sheetName || "Sheet1";

          if (sheetsMetadata.sheetOperation === "1") {
            const data = Array.isArray(dynamicFields.jobs)
              ? dynamicFields.jobs
              : [dynamicFields.jobs || ""];
            await appendRowToSheet(
              accessToken,
              sheetsMetadata.sheetid,
              sheetName,
              data,
              dynamicFields,
            );
          } else if (sheetsMetadata.sheetOperation === "2") {
            const data = Array.isArray(dynamicFields.jobs)
              ? dynamicFields.jobs
              : [dynamicFields.jobs || ""];
            await appendColumnToSheet(
              accessToken,
              sheetsMetadata.sheetid,
              data,
              dynamicFields,
            );
          } else if (sheetsMetadata.sheetOperation === "3") {
            const data = Array.isArray(dynamicFields.jobs)
              ? dynamicFields.jobs
              : [dynamicFields.jobs || ""];
            await createSheet(
              accessToken,
              sheetsMetadata.sheetid,
              sheetName,
              data,
            );
          }
          console.log("✅ Google Sheets operation completed");
        } catch (error: any) {
          console.error(
            "Failed to process Google Sheets action:",
            error.message,
          );
        }
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`✅ Zap execution finished for run: ${zapRunId}`);
  } catch (error) {
    console.error(`Error executing ZapRun ${zapRunId}:`, error);
  }
}
