import { Kafka, Partitioners } from "kafkajs";
import { prismaClient } from "@flowcatalyst/database";

const TOPIC_NAME = "zap-events";

const kafka = new Kafka({
  clientId: "outbox-processor-2",
  brokers: ["localhost:9092"],
  // brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
});

async function waitForKafka() {
  const admin = kafka.admin();
  while (true) {
    try {
      await admin.connect();
      await admin.disconnect();
      return;
    } catch (err) {
      console.error("⏳ Waiting for Kafka to be ready...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function main() {
  await waitForKafka();

  const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });
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
      messages: pendingRows.map((r: any) => {
        return {
          value: JSON.stringify({ zapRunId: r.zapRunId, stage: 0 }),
        };
      }),
    });

    //Delete from the Outbox
    await prismaClient.zapRunOutbox.deleteMany({
      where: {
        id: {
          in: pendingRows.map((r: any) => r.id),
        },
      },
    });
    await new Promise((r) => setTimeout(r, 3000));
  }
}

main();
