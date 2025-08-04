require("dotenv").config();

import { Kafka, Partitioners } from "kafkajs";
import { prismaClient } from "@flowcatalyst/database";
import { parseDynamicFields } from "./parser";
import { sendEmail } from "./email";
import { transferSOL } from "./solana";
import { loadTemplate, renderTemplate } from "./templateLoader";

const TOPIC_NAME = "zap-events";

const kafka = new Kafka({
  clientId: "outbox-processor-2",
  brokers: ["localhost:9092"],
});

const parseJson = (data: any, fallback: any = {}) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || fallback;
  } catch (error) {
    console.error("JSON parsing failed:", error);
    return fallback;
  }
};

async function main() {
  const consumer = kafka.consumer({ groupId: "main-worker" });
  await consumer.connect();
  const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });
  await producer.connect();

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

      const dynamicFieldsVal = zapRunDetails?.metadata;
      // If action does not exists
      if (!currentAction) {
        console.log("Current Action not found");
        return;
      }

      if (currentAction?.type.name === "Email") {
        console.log("Started Working");
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
          console.log("Sent Email");
          await sendEmail({ to, subject, body: emailBody });
        } catch (error: any) {
          console.error("Failed to process email action:", error.message);
        }
      }

      if (currentAction?.type.name === "Solana") {
        const SolanaData = parseDynamicFields(
          parseJson(currentAction.metadata),
          parseJson(dynamicFieldsVal),
        );
        await transferSOL(SolanaData.ToSolanaAddress, SolanaData.Amount);
        console.log("Sent solana", SolanaData);
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
