import express from "express";
import prisma from "@flowcatalyst/database";

import { PrismaClient } from "@flowcatalyst/database";

const client = new PrismaClient();

const app = express();
app.use(express.json());

// Password Logic
app.post("/hooks/catch/:userId/:zapId", async (req, res) => {
  const userId = req.params.userId;
  const zapId = req.params.zapId;
  const body = req.body;

  // Store in db a new trigger
  await client.$transaction(async (tx) => {
    const run = await tx.zapRun.create({
      data: {
        zapId: zapId,
        metadata: body,
      },
    });

    await tx.zapRunOutbox.create({
      data: {
        zapRunId: run.id,
      },
    });
  });
  res.json({
    message: "Webhook received successfully",
  });
  // TODO: push it to a queue(redis/kafka)
});

app.listen(3000);
