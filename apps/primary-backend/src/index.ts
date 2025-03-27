import dotenv from "dotenv";
import express from "express";
import { userRouter } from "./router/user";
import { zapRouter } from "./router/zap";
import cors from "cors";
import { triggerRouter } from "./router/trigger";
import { actionRouter } from "./router/action";
import { triggerResponseRouter } from "./router/triggerResponse";
import { JWT_PASSWORD } from "./config";
const cookieParser = require("cookie-parser");
const rateLimiter = require("express-rate-limit");
const session = require("express-session");
const passport = require("passport");
const axios = require("axios");
import { prismaClient } from "@flowcatalyst/database";
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
import jwt from "jsonwebtoken";
// import { subscriptionsRouter } from "./router/subscription";
import { pricingRouter } from "./router/pricing";
import { aiRouter } from "./router/ai";
import { createFreeSubscription } from "./utis/subscription";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser(JWT_PASSWORD));
// app.use(
//   rateLimiter({
//     windowMs: 15 * 60 * 1000,
//     max: 60,
//   }),
// );

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 },
  }),
);

app.use(passport.initialize());
// app.use(passport.session());

// Passport session setup
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done: any) => {
  try {
    const user = await prismaClient.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
//TODO: Create random password for OAuth users
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "http://localhost:4000/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("Google account has no email"), null);
        }

        let user = await prismaClient.user.findUnique({
          where: { email },
        });

        if (user) {
          // If user exists, update Google ID
          await prismaClient.user.update({
            where: { email },
            data: { googleId: profile.id },
          });
        } else {
          // Create new user
          user = await prismaClient.user.create({
            data: {
              name: profile.displayName,
              email,
              googleId: profile.id,
              password: "",
            },
          });
          await createFreeSubscription(prismaClient, user.id);
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

// Passport configuration for GitHub
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/github/callback",
      scope: ["user:email"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any,
    ) => {
      try {
        // Fetch the user's email addresses using the access token
        const response = await axios.get("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Extract the primary email address
        const emails = response.data;
        const primaryEmail = emails.find(
          (email: any) => email.primary && email.verified,
        );
        const email = primaryEmail ? primaryEmail.email : "";

        if (!email) {
          return done(new Error("No email found in GitHub account"), null);
        }

        // Check if a user with this email already exists
        let user = await prismaClient.user.findUnique({
          where: { email },
        });

        if (user) {
          // If user exists, update their GitHub ID
          user = await prismaClient.user.update({
            where: { email },
            data: { githubId: profile.id },
          });
        } else {
          // If no user exists, create a new one
          user = await prismaClient.user.create({
            data: {
              name: profile.username || "GitHub User",
              email,
              githubId: profile.id,
              password: "", // No password for OAuth users
            },
          });
          await createFreeSubscription(prismaClient, user.id);
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

app.get(
  "/auth/google",
  (req, res, next) => {
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req: any, res) => {
    const token = jwt.sign({ id: req.user.id }, JWT_PASSWORD, {
      expiresIn: "10h",
    });

    const oneDay = 1000 * 60 * 60 * 24;
    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: process.env.NODE_ENV === "production",
      signed: true,
    });

    res.header("auth", token);

    // res.redirect("http://localhost:3000/workflows");
    res.redirect(`http://localhost:3000/workflows?token=${token}`);
  },
);

// Routes for GitHub
app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req: any, res) => {
    const token = jwt.sign({ id: req.user.id }, JWT_PASSWORD, {
      expiresIn: "10h",
    });

    const oneDay = 1000 * 60 * 60 * 24;

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: process.env.NODE_ENV === "production",
      signed: true,
    });

    res.header("auth", token);

    // res.redirect("http://localhost:3000/workflows");
    res.redirect(`http://localhost:3000/workflows?token=${token}`);
  },
);

app.use("/api/v1/user", userRouter);

app.use("/api/v1/zap", zapRouter);

app.use("/api/v1/trigger", triggerRouter);

app.use("/api/v1/action", actionRouter);

app.use("/api/v1/trigger-response", triggerResponseRouter);

// app.use("/api/v1/subscription", subscriptionsRouter);
app.use("/api/v1/pricing", pricingRouter);

app.use("/api/v1/ai", aiRouter);

app.listen(4000, () => {
  console.log(`Server is working on http://localhost:4000`);
});
