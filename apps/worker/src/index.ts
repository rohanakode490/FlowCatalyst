import { Kafka } from "kafkajs";

const TOPIC_NAME = "zap-events";

const kafka = new Kafka({
  clientId: "outbox-processor",
  brokers: ["localhost:9092"],
});

async function main() {
  const consumer = kafka.consumer({ groupId: "main-worker" });
  await consumer.connect();

  // Get action from Kafka queue
  await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });

  // Run the action
  await consumer.run({
    autoCommit: false, //Do not auto-Commit(incase the worker failed)
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      });

      //TODO: The operation(action)

      await new Promise((r) => setTimeout(r, 500));
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
