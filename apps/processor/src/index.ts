import { prismaClient } from "@flowcatalyst/database";
const { Kafka } = require("kafkajs");

const TOPIC_NAME = "zap-events";

const kafka = new Kafka({
  clientId: "outbox-processor",
  brokers: ["localhost:9092"],
});

async function main() {
  const producer = kafka.producer();
  await producer.connect();

  while (1) {
    // Put in the Outbox
    const pendingRows = await prismaClient.zapRunOutbox.findMany({
      where: {},
      take: 10,
    });

    // Put in the queue
    producer.send({
      topic: TOPIC_NAME,
      messages: pendingRows.map((r) => {
        return {
          value: r.zapRunId,
        };
      }),
    });

    //Delete from the Outbox
    await prismaClient.zapRunOutbox.deleteMany({
      where: {
        id: {
          in: pendingRows.map((r) => r.id),
        },
      },
    });
  }
}

main();
