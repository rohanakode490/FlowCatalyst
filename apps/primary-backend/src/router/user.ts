import { Router } from "express";
import { authMiddleware } from "../middleware";
import { SigninSchema, SignupSchema } from "../types";
import { prismaClient } from "@flowcatalyst/database";
import { JWT_PASSWORD } from "../config";
import jwt from "jsonwebtoken";
const passport = require("passport");
const bcrypt = require("bcryptjs");

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

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(parsedData.data.password, salt);

  //Store in DataBase
  await prismaClient.user.create({
    data: {
      name: parsedData.data.name,
      email: parsedData.data.email,
      password: hashedPassword,
    },
  });

  return res.json({
    message: "Please verify your account by checking your email",
  });
});

router.post("/login", async (req, res) => {
  const body = req.body;
  const parsedData = SigninSchema.safeParse(body);

  if (!parsedData.success) {
    return res.status(411).json({
      message: "Incorrect Inputs",
    });
  }
  // Find user by email
  const user = await prismaClient.user.findUnique({
    where: { email: parsedData.data.email },
  });
  if (!user) {
    return res.status(401).json({ message: "Email not found" });
  }

  // Validate password
  const isPasswordValid = await bcrypt.compare(
    parsedData.data.password,
    user.password,
  );
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Incorrect password" });
  }

  // Generate JWT
  const token = jwt.sign({ id: user.id }, JWT_PASSWORD, { expiresIn: "10h" });

  const oneDay = 1000 * 60 * 60 * 24;

  // Set JWT in a cookie
  // res.cookie("token", token, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "strict",
  //   maxAge: 3600000, // 1 hour in milliseconds
  // });
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });

  res.header("auth", token);

  res.status(200).json({
    message: "Logged in successfully",
    token,
  });
});

router.get("/", authMiddleware, async (req, res) => {
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
    id,
  });
});

export const userRouter = router;
