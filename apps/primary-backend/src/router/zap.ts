import { Router } from "express";
import { authMiddleware } from "../middleware";
import { ZapCreateSchema } from "../types";
import { prismaClient } from "../db";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  const body = req.body;
  //@ts-ignore
  const id = req.id;
  const parsedData = ZapCreateSchema.safeParse(body);

  if (!parsedData.success) {
    return res.status(411).json({
      message: "Incorrect Inputs",
    });
  }

  const zapId = await prismaClient.$transaction(async (tx) => {
    try {
      // Create the zap with actions in a single transaction
      const zap = await prismaClient.zap.create({
        data: {
          userId: id,
          triggerId: "", // Temporary triggerId
          actions: {
            create: parsedData.data.actions.map((r, index) => ({
              actionId: r.availableActionId,
              sortingOrder: index,
              metadata: r.actionMetadata,
            })),
          },
        },
      });

      // Create the trigger and associate it with the zap
      const trigger = await tx.trigger.create({
        data: {
          triggerId: parsedData.data.availableTriggerId,
          zapId: zap.id,
        },
      });

      // Update the zap with the correct triggerId
      await prismaClient.zap.update({
        where: {
          id: zap.id,
        },
        data: {
          triggerId: trigger.id,
        },
      });

      return zap.id;
    } catch (error) {
      // Database error
      throw new Error("Failed to create zap");
    }
  });

  return res.json({
    zapId,
  });
});

router.get("/", authMiddleware, async (req, res) => {
  // @ts-ignore
  const id = req.id;
  const zaps = await prismaClient.zap.findMany({
    where: {
      userId: id,
    },
    include: {
      actions: {
        include: {
          type: true,
        },
      },
      trigger: {
        include: {
          type: true,
        },
      },
    },
  });

  res.json({
    zaps,
  });
});

router.get("/:zapId", authMiddleware, async (req, res) => {
  // @ts-ignore
  const id = req.id;
  const zapId = req.params.zapId;

  const zap = await prismaClient.zap.findFirst({
    where: {
      id: zapId,
      userId: id,
    },
    include: {
      actions: {
        include: {
          type: true,
        },
      },
      trigger: {
        include: {
          type: true,
        },
      },
    },
  });

  res.json({
    zap,
  });
});

export const zapRouter = router;
