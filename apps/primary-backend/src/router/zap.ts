import { Router } from "express";
import { authMiddleware } from "../middleware";

const router = Router();

router.post("/", authMiddleware, (req, res) => {
  console.log("Create a zap");
});

router.get("/", authMiddleware, (req, res) => {
  console.log("");
});

router.post("/:zapId", authMiddleware, (req, res) => {
  console.log("Zap Info");
});

export const zapRouter = router;
