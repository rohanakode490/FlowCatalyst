import { Router } from "express";
import { authMiddleware } from "../middleware";

const router = Router();

router.post("/signup", (req, res) => {
  console.log("signup handler");
});

router.post("/login", (req, res) => {
  console.log("Login handler");
});

router.post("/user", authMiddleware, (req, res) => {
  console.log("signup handler");
});

export const userRouter = router;
