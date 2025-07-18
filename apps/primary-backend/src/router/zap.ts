import { Router } from "express";
import { authMiddleware } from "../middleware";
import { ZapCreateSchema } from "../types";
import { PrismaTransactionalClient } from "../db";

import { prismaClient } from "@flowcatalyst/database";
import axios from "axios";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  const { scraperType, zapData } = req.body;
  //@ts-ignore
  const id = req.id;
  const parsedData = ZapCreateSchema.safeParse(zapData);
  console.log("bdy", scraperType, zapData);

  if (!parsedData.success) {
    return res.status(411).json({
      message: "Incorrect Inputs",
    });
  }

  try {
    const ID = await prismaClient.$transaction(
      async (tx: PrismaTransactionalClient) => {
        // Create the zap with actions in a single transaction
        const zap = await prismaClient.zap.create({
          data: {
            userId: id,
            isActive: true,
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
            userId: id,
            triggerId: parsedData.data.availableTriggerId,
            metadata: parsedData.data.triggerMetadata,
            zapId: zap.id,
          },
        });
        console.log("trigger", trigger);
        // Update the zap with the correct triggerId
        await prismaClient.zap.update({
          where: {
            id: zap.id,
          },
          data: {
            triggerId: trigger.id,
          },
        });

        return { ZapId: zap.id, TriggerId: trigger.id };
      },
    );
    if (parsedData.data.triggerMetadata.keywords !== undefined) {
      await axios.post(`${process.env.HOOKS_APP_URL}/schedule`, {
        triggerId: ID.TriggerId,
        scraperType: scraperType,
        userId: id,
      });
    }

    res.json({ success: true, zapId: ID.ZapId });
  } catch (error: any) {
    // console.error("Failed to save Zap:", error);
    res.status(500).json({ message: "Failed to save Zap" });
  }
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
    zaps: zaps.length > 0 ? zaps : [],
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

router.put("/:zapId", authMiddleware, async (req, res) => {
  const { zapId } = req.params;
  const body = req.body;

  const parsedData = ZapCreateSchema.safeParse(body);

  if (!parsedData.success) {
    return res.status(400).json({
      message: "Incorrect Inputs",
      errors: parsedData.error.errors,
    });
  }

  try {
    const updatedZap = await prismaClient.$transaction(async (tx) => {
      // Update the trigger
      const trigger = await tx.trigger.update({
        where: { zapId },
        data: {
          triggerId: parsedData.data.availableTriggerId,
          metadata: parsedData.data.triggerMetadata,
        },
      });

      // Delete existing actions
      await tx.action.deleteMany({
        where: { zapId },
      });

      // Create new actions
      const actions = await Promise.all(
        parsedData.data.actions.map((action, index) =>
          tx.action.create({
            data: {
              zapId,
              actionId: action.availableActionId,
              sortingOrder: index,
              metadata: action.actionMetadata,
            },
          }),
        ),
      );

      return { trigger, actions };
    });

    //For Testing
    // if (parsedData.data.triggerMetadata.keywords !== undefined) {
    //   await axios.post(`${process.env.HOOKS_APP_URL}/schedule`, {
    //     triggerId: updatedZap.trigger.id,
    //   });
    // }

    res.json({
      success: true,
      updatedZap,
    });
  } catch (error) {
    console.error("Failed to update Zap:", error);
    res.status(500).json({ message: "Failed to update Zap" });
  }
});

router.delete("/:zapId", authMiddleware, async (req, res) => {
  const { zapId } = req.params;
  //@ts-ignore
  const userId = req.id;

  try {
    // Check if the Zap belongs to the user
    const zap = await prismaClient.zap.findUnique({
      where: { id: zapId },
      include: { trigger: true, actions: true, zapRuns: true },
    });

    if (!zap) {
      return res.status(404).json({ message: "Zap not found" });
    }

    if (zap.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this Zap" });
    }

    // Delete the Zap and its associated trigger and actions
    await prismaClient.$transaction(async (tx) => {
      // Delete the ZapRun
      if (zap.zapRuns.length > 0) {
        await tx.zapRun.deleteMany({
          where: { zapId: zapId },
        });
      }

      // Delete the trigger
      if (zap.trigger) {
        await tx.trigger.delete({
          where: { id: zap.trigger.id },
        });
      }

      // Delete the actions
      if (zap.actions.length > 0) {
        await tx.action.deleteMany({
          where: { zapId },
        });
      }

      // Delete the Zap
      await tx.zap.delete({
        where: { id: zapId },
      });
    });

    res.json({
      success: true,
      message: "Zap deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete Zap:", error);
    res.status(500).json({ message: "Failed to delete Zap" });
  }
});

router.patch("/:zapId", authMiddleware, async (req, res) => {
  const { zapId } = req.params;
  const { isActive } = req.body;

  //@ts-ignore
  const userId = req.id;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be a boolean" });
  }

  try {
    const zap = await prismaClient.zap.findFirst({
      where: { id: zapId, userId },
    });

    if (!zap) {
      return res.status(404).json({ message: "Zap not found" });
    }

    await prismaClient.zap.update({
      where: { id: zapId },
      data: { isActive },
    });
    res.json({ success: true, message: `Zap Updated to ${isActive}` });
  } catch (error) {
    console.error("Failed to update Zap:", error);
    res.status(500).json({ message: "Failed to update Zap" });
  }
});

export const zapRouter = router;
