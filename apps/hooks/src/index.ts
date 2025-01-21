import express from "express";

import { Prisma, prismaClient } from "@flowcatalyst/database";

type PrismaTransactionalClient = Prisma.TransactionClient;

const app = express();
app.use(express.json());

// Password Logic
app.post("/hooks/catch/:userId/:zapId", async (req, res) => {
  const userId = req.params.userId;
  const zapId = req.params.zapId;
  const body = req.body;

  // Store in db a new trigger
  await prismaClient.$transaction(async (tx: PrismaTransactionalClient) => {
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
});

app.listen(4001);
