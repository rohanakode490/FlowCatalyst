const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
import { prismaClient } from "@flowcatalyst/database";

interface Profile {
  id: string;
  displayName: string;
  username: string;
  emails: { value: string }[];
}

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
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "http://localhost:4000/api/v1/user/auth/google/callback",
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: any,
    ) => {
      try {
        console.log("Google Profile:", profile);
        // Check if the user already exists in the database
        let user = await prismaClient.user.findUnique({
          where: { googleId: profile.id },
        });

        if (!user) {
          user = await prismaClient.user.create({
            data: {
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              password: "",
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);
