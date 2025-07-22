import { Router } from "express";
import { prismaClient } from "@flowcatalyst/database";
import { authMiddleware } from "../middleware";

const router = Router();

// router.post("/:triggerId", async (req, res) => {
//   const { triggerId } = req.params;
//   const responseData = req.body; // Trigger response data
//
//   //  Empty or malformed response
//   if (!responseData || typeof responseData !== "object") {
//     return res.status(400).json({ message: "Invalid trigger response data" });
//   }
//
//   // Extract fields
//   const extractedData = {
//     email: responseData.email,
//     solanaAddress: responseData.solanaAddress,
//   };
//
//   //Missing required fields
//   if (!extractedData.email || !extractedData.solanaAddress) {
//     return res
//       .status(400)
//       .json({ message: "Missing required fields in trigger response" });
//   }
//
//   // Invalid data types
//   if (
//     typeof extractedData.email !== "string" ||
//     typeof extractedData.solanaAddress !== "string"
//   ) {
//     return res
//       .status(400)
//       .json({ message: "Invalid data types in trigger response" });
//   }
//
//   try {
//     // Update the trigger's metadata
//     const updatedTrigger = await prismaClient.trigger.update({
//       where: { id: triggerId },
//       data: {
//         metadata: extractedData,
//       },
//     });
//
//     res.json({
//       updatedTrigger,
//     });
//   } catch (error) {
//     // Invalid trigger ID or database error
//     console.error("Failed to update trigger metadata:", error);
//     res.status(500).json({ message: "Failed to update trigger metadata" });
//   }
// });

router.get("/hasTrigger", authMiddleware, async (req, res) => {
  //@ts-ignore
  const userId = req.id;
  const triggerType = req.query.type as string;

  if (!triggerType) {
    return res.status(400).json({ message: "Trigger type is required" });
  }

  try {
    const Trigger = await prismaClient.trigger.findFirst({
      where: {
        userId: userId,
        type: {
          name: triggerType,
        },
      },
    });
    res.status(200).json({ hasLinkedInTrigger: !!Trigger });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error in fetching" });
  }
});

router.get("/:triggerId", async (req, res) => {
  const { triggerId } = req.params;

  const trigger = await prismaClient.trigger.findUnique({
    where: { id: triggerId },
    include: {
      type: true, // Include the related AvailableTrigger record
    },
  });

  const githubEventType = trigger?.metadata;

  if (!trigger) {
    return res.status(404).json({ message: "Trigger not found" });
  }
  res.json({
    triggerData: trigger.type.metadata,
    githubEventType,
  });
});

export const triggerResponseRouter = router;
