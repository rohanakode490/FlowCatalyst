require("dotenv").config();

import { Kafka } from "kafkajs";
import { prismaClient } from "@flowcatalyst/database";
import { parseDynamicFields } from "./parser";
import { sendEmail } from "./email";
import { transferSOL } from "./solana";

const TOPIC_NAME = "zap-events";

const kafka = new Kafka({
  clientId: "outbox-processor-2",
  brokers: ["localhost:9092"],
});

const parseJson = (data: any) =>
  typeof data === "string" ? JSON.parse(data) : data;

async function main() {
  const consumer = kafka.consumer({ groupId: "main-worker" });
  await consumer.connect();
  const producer = kafka.producer();
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
        (x) => x.sortingOrder === currStage,
      );

      const dynamicFieldsVal = zapRunDetails?.metadata;
      // If action does not exists
      if (!currentAction) {
        console.log("Current Action not found");
        return;
      }

      //TODO: The operation(action)
      if (currentAction?.type.name === "Email") {
        const emailData = parseDynamicFields(
          parseJson(currentAction.metadata),
          parseJson(dynamicFieldsVal),
        );

        const to = emailData.recipientEmail;
        const subject = emailData.emailSubject;
        const body = emailData.emailBody;
        await sendEmail({ to, subject, body });
        console.log("Sent Email");
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
