import { Kafka } from "kafkajs";
import { prismaClient } from "@flowcatalyst/database";

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
    await producer.send({
      topic: TOPIC_NAME,
      messages: pendingRows.map((r) => {
        return {
          value: JSON.stringify({ zapRunId: r.zapRunId, stage: 0 }),
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
    await new Promise((r) => setTimeout(r, 3000));
  }
}

main();
