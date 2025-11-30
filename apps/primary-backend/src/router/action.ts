import { Router } from "express";
import { prismaClient } from "@flowcatalyst/database";

const router = Router();

router.get("/available", async (req, res) => {
  const availableActions = await prismaClient.availableAction.findMany({
    where:{
      show:true,
    }
  });

  res.json({
    availableActions,
  });
});

export const actionRouter = router;
