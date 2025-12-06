import { Kafka, Partitioners } from "kafkajs";
import { prismaClient } from "@flowcatalyst/database";
import dotenv from "dotenv";
dotenv.config();

const TOPIC_NAME = "zap-events";

console.log(process.env.KAFKA_BROKERS);
const kafka = new Kafka({
  clientId: "outbox-processor-2",
  // brokers: ["localhost:9092"],
  brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
});

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

  const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });
  await producer.connect();
  console.log("✅ Kafka producer connected successfully");

  while (1) {
    console.log("Finding in Outbox");
    // Put in the Outbox
    const pendingRows = await prismaClient.zapRunOutbox.findMany({
      where: {},
      take: 10,
    });

    if (pendingRows) {
      console.log("Found in Outbox", pendingRows);
    }

    console.log("@fc-processor Putting in queue");
    // Put in the queue
    await producer.send({
      topic: TOPIC_NAME,
      messages: pendingRows.map((r: any) => {
        return {
          value: JSON.stringify({ zapRunId: r.zapRunId, stage: 0 }),
        };
      }),
    });

    console.log("Deleting from the Temp DB table");
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
