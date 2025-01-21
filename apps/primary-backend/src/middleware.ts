import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";

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
    console.log("errors", error);
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
