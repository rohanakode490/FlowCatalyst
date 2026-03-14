import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";
import { prismaClient } from "@flowcatalyst/database";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Check for token in the Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.split(" ")[1]; // Extract "Bearer <token>"

  // Check for token in the signed cookie
  const tokenFromCookie = req.signedCookies.token;

  // Use the token from the header if it exists, otherwise fall back to the cookie
  const token = getToken(tokenFromHeader, tokenFromCookie);

  if (!token) {
    return res.status(401).json({ message: "Token is missing." });
  }

  try {
    const payload = jwt.verify(token, JWT_PASSWORD);
    //@ts-ignore
    req.id = payload.id;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired." });
    }
    return res.status(403).json({
      message: "You are not logged in.",
    });
  }
}

function getToken(tokenFromHeader: any, tokenFromCookie: any) {
  if (
    tokenFromHeader !== null &&
    tokenFromHeader !== undefined &&
    tokenFromHeader !== "" &&
    tokenFromHeader !== "null" &&
    tokenFromHeader !== "undefined"
  ) {
    return tokenFromHeader;
  }
  if (
    tokenFromCookie !== null &&
    tokenFromCookie !== undefined &&
    tokenFromCookie !== "" &&
    tokenFromCookie !== "null" &&
    tokenFromCookie !== "undefined"
  ) {
    return tokenFromCookie;
  }
  return null; // or handle as needed if both are invalid
}

export const aiRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    //@ts-ignore
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({ error: "Login Required" });
    }

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: "active",
            currentPeriodEnd: { gte: new Date() },
          },
          include: { plan: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const activeSubscription = user.subscriptions[0];

    // Bypass limits for paid plans
    if (activeSubscription && activeSubscription.plan.name !== "free") {
      return next();
    }

    // Check lifetime prompt count
    const currentCount = user.aiPromptCount;

    if (currentCount >= 2) {
      return res.status(429).json({
        error: "🔒 Lifetime Limit Reached",
        message: "You've used your 2 free AI prompts",
        upgradeUrl: "/pricing",
        remaining: 0,
      });
    }

    // Attach limit info to response locals
    res.locals.aiLimit = {
      remaining: 2 - currentCount,
    };

    next();
  } catch (error) {
    console.error("Rate limit error:", error);
    res.status(500).json({ error: "Rate limit service unavailable" });
  }
};
