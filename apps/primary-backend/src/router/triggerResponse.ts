import { Router } from "express";
import { prismaClient } from "../db";

const router = Router();

router.post("/:triggerId", async (req, res) => {
  const { triggerId } = req.params;
  const responseData = req.body; // Trigger response data

  //  Empty or malformed response
  if (!responseData || typeof responseData !== "object") {
    return res.status(400).json({ message: "Invalid trigger response data" });
  }

  // Extract fields (e.g., email, solanaAddress)
  const extractedData = {
    email: responseData.email,
    solanaAddress: responseData.solanaAddress,
  };

  //Missing required fields
  if (!extractedData.email || !extractedData.solanaAddress) {
    return res
      .status(400)
      .json({ message: "Missing required fields in trigger response" });
  }

  // Invalid data types
  if (
    typeof extractedData.email !== "string" ||
    typeof extractedData.solanaAddress !== "string"
  ) {
    return res
      .status(400)
      .json({ message: "Invalid data types in trigger response" });
  }

  try {
    // Update the trigger's metadata
    const updatedTrigger = await prismaClient.trigger.update({
      where: { id: triggerId },
      data: {
        metadata: extractedData,
      },
    });

    res.json({
      updatedTrigger,
    });
  } catch (error) {
    // Invalid trigger ID or database error
    console.error("Failed to update trigger metadata:", error);
    res.status(500).json({ message: "Failed to update trigger metadata" });
  }
});

router.get("/:triggerId", async (req, res) => {
  const { triggerId } = req.params;

  const trigger = await prismaClient.trigger.findUnique({
    where: { id: triggerId },
  });

  if (!trigger) {
    return res.status(404).json({ message: "Trigger not found" });
  }

  res.json({
    triggerData: trigger.metadata,
  });
});

export const triggerResponseRouter = router;