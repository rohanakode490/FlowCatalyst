require("dotenv").config();

import dotenv from "dotenv";
import { Kafka, Partitioners } from "kafkajs";
import { prismaClient } from "@flowcatalyst/database";
import { parseDynamicFields } from "./parser";
import { sendEmail } from "./email";
import { transferSOL } from "./solana";
import { loadTemplate, renderTemplate } from "./templateLoader";
import {
  appendColumnToSheet,
  appendRowToSheet,
  createSheet,
  getGoogleAccessToken,
} from "./googlesheets";

dotenv.config();

const TOPIC_NAME = "zap-events";

const kafka = new Kafka({
  clientId: "outbox-processor-2",
  // brokers: ["localhost:9092"],
  brokers: [process.env.KAFKA_BROKERS || "kafka:9092"],
});

const parseJson = (data: any, fallback: any = {}) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || fallback;
  } catch (error) {
    console.error("JSON parsing failed:", error);
    return fallback;
  }
};

async function waitForKafka() {
  const admin = kafka.admin();
  while (true) {
    try {
      await admin.connect();
      console.log("✅ Kafka is ready and connected");
      await admin.disconnect();
      return;
    } catch (err) {
      console.error("⏳ Waiting for Kafka to be ready...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function main() {
  console.log("Starting worker application...");
  await waitForKafka();
  console.log("Connecting Kafka consumer and producer...");
  const consumer = kafka.consumer({ groupId: "main-worker" });
  await consumer.connect();
  const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });
  await producer.connect();
  console.log("✅ Kafka consumer and producer connected successfully");

  // Get action from Kafka queue
  await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });

  // Run the action
  await consumer.run({
    autoCommit: false, //Do not auto-Commit(incase the worker failed)
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value?.toString()) {
        return;
      }

      const parsedValue = JSON.parse(message.value?.toString());
      console.log("Received Kafka message:", { zapRunId: parsedValue.zapRunId, stage: parsedValue.stage });
      const zapRunId = parsedValue.zapRunId;
      const currStage = parsedValue.stage; // Which action is going to happen

      const zapRunDetails = await prismaClient.zapRun.findFirst({
        where: {
          id: zapRunId,
        },
        include: {
          zap: {
            include: {
              actions: {
                include: {
                  type: true,
                },
              },
            },
          },
        },
      });

      const currentAction = zapRunDetails?.zap.actions.find(
        (x: any) => x.sortingOrder === currStage,
      );
      console.log("Current action found:", { actionType: currentAction?.type?.name, stage: currStage });

      const dynamicFieldsVal = zapRunDetails?.metadata;
      // If action does not exists
      if (!currentAction) {
        console.log("Current Action not found");
        return;
      }

      if (currentAction?.type.name === "Email") {
        console.log("Processing Email action");
        try {
          // Safely parse metadata and dynamic fields
          const emailMetadata = parseJson(currentAction.metadata);
          const dynamicFields = parseJson(dynamicFieldsVal);

          if (!emailMetadata) {
            throw new Error("Email metadata is missing or invalid");
          }

          // Validate required fields
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
                .map((job: any) => {
                  return parseDynamicFields(subject, { trigger: job });
                })
                .join(", ");
            }

            // Replace {{trigger.emailBodyTemplate}} with the rendered HTML
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

            //  Replace placeholders in emailBody for each job
            if (emailBody.includes("{{trigger.")) {
              emailBody = dynamicFields.jobs
                .map((job: any) => {
                  return parseDynamicFields(emailBody, { trigger: job });
                })
                .join("</br>");
            }
          } else {
            // Fallback for non-array case or simple strings
            subject = parseDynamicFields(subject, dynamicFields);
            emailBody = parseDynamicFields(emailBody, dynamicFields);
          }
          console.log("✅ Email sent successfully to:", to);
          await sendEmail({ to, subject, body: emailBody });
        } catch (error: any) {
          console.error("Failed to process email action:", error.message);
        }
      } else if (currentAction?.type.name === "Solana") {
        const SolanaData = parseDynamicFields(
          parseJson(currentAction.metadata),
          parseJson(dynamicFieldsVal),
        );
        console.log("🪙 Processing Solana transfer:", SolanaData);
        await transferSOL(SolanaData.ToSolanaAddress, SolanaData.Amount);
        console.log("✅ Solana transfer completed:", { to: SolanaData.ToSolanaAddress, amount: SolanaData.Amount });
      } else if (currentAction?.type.name === "Google Sheets") {
        console.log("📊 Processing Google Sheets operation");
        console.log("currentAction", currentAction);
        const sheetsMetadata = parseJson(currentAction.metadata);
        const dynamicFields = parseJson(dynamicFieldsVal);
        console.log("sheetsMetadata", sheetsMetadata);
        console.log("dynamicFields.jobs", dynamicFields.jobs);
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
        console.log("accessToken", accessToken);
        console.log("📊 Google Sheets operation details:", { operation: sheetsMetadata.sheetOperation, sheetName });

        if (sheetsMetadata.sheetOperation === "1") {
          // Append Row
          const data = Array.isArray(dynamicFields.jobs)
            ? dynamicFields.jobs
            : [dynamicFields.jobs || ""];
          console.log('Adding row with data', data)
          await appendRowToSheet(
            accessToken,
            sheetsMetadata.sheetid,
            sheetName,
            data,
            dynamicFields,
          );
        } else if (sheetsMetadata.sheetOperation === "2") {
          // Append Column
          const data = Array.isArray(dynamicFields.jobs)
            ? dynamicFields.jobs
            : [dynamicFields.jobs || ""];
          await appendColumnToSheet(
            accessToken,
            sheetsMetadata.sheetid,
            data,
            dynamicFields
          );
        } else if (sheetsMetadata.sheetOperation === "3") {
          // Create Sheet
          const data = Array.isArray(dynamicFields.jobs)
            ? dynamicFields.jobs
            : [dynamicFields.jobs || ""];
          await createSheet(
            accessToken,
            sheetsMetadata.sheetid,
            sheetName,
            data
          );
        } else {
          throw new Error(`Invalid operation: ${sheetsMetadata.sheetOperation}`);
        }
        console.log(
          `Google Sheets operation ${sheetsMetadata.sheetOperation} completed`,
        );
      }
      await new Promise((r) => setTimeout(r, 500));

      const lastStage = (zapRunDetails?.zap.actions?.length || 1) - 1;

      // Check Last Stage
      if (lastStage !== currStage) {
        await producer.send({
          topic: TOPIC_NAME,
          messages: [
            {
              value: JSON.stringify({
                stage: currStage + 1,
                zapRunId,
              }),
            },
          ],
        });
      }

      console.log("Processing Done");

      // Commit offset
      await consumer.commitOffsets([
        {
          topic: TOPIC_NAME,
          partition: partition,
          offset: (parseInt(message.offset) + 1).toString(), //If failed start with the next of the completed one.
        },
      ]);
    },
  });
}

main();
