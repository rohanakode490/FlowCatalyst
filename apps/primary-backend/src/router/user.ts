import { Router } from "express";
import { authMiddleware } from "../middleware";
import { SignupSchema } from "../types";
import { prismaClient } from "../db";
import { JWT_PASSWORD } from "../config";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/signup", async (req, res) => {
  const body = req.body;
  const parsedData = SignupSchema.safeParse(body);

  if (!parsedData.success) {
    return res.status(411).json({
      message: "Incorrect Inputs",
    });
  }

  const userExists = await prismaClient.user.findFirst({
    where: {
      email: parsedData.data.email,
    },
  });

  // Check if Already present in Database
  if (userExists) {
    return res.status(403).json({
      message: "User Already Exists",
    });
  }

  //Store in DataBase
  await prismaClient.user.create({
    data: {
      name: parsedData.data.name,
      email: parsedData.data.email,
      //TODO: Hash password
      password: parsedData.data.password,
    },
  });

  //TODO: Send email

  return res.json({
    message: "Please verify your account by checking your email",
  });
});

router.post("/login", async (req, res) => {
  const body = req.body;
  const parsedData = SignupSchema.safeParse(body);

  if (!parsedData.success) {
    return res.status(411).json({
      message: "Incorrect Inputs",
    });
  }

  // Check in the DataBase
  const user = await prismaClient.user.findFirst({
    where: {
      email: parsedData.data.email,
      password: parsedData.data.password, //TODO: After hashing in the "signup" check here as well
    },
  });

  //Wrong Credentials
  if (!user) {
    return res.status(403).json({
      message: "Incorrect Credentials",
    });
  }

  // Sign in with JWT
  const token = jwt.sign(
    {
      id: user.id,
    },
    JWT_PASSWORD,
  );

  res.json({
    token: token,
  });
});

router.get("/", authMiddleware, async (req, res) => {
  //TODO: Fix the type
  //@ts-ignore
  const id = req.id;

  const user = await prismaClient.user.findFirst({
    where: {
      id,
    },
    select: {
      name: true,
      email: true,
    },
  });

  return res.json({
    user,
  });
});

export const userRouter = router;
