import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../generated/prisma";
import UserRepository from "../repositories/user.repository";
import { TCreateUserInput } from "../types/user.types";
import logger from "../utils/logger";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${
        process.env.API_BASE_URL || "http://localhost:2020/api"
      }/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails || !profile.emails[0].value) {
          return done(new Error("Email not found in Google profile"), false);
        }

        const email = profile.emails[0].value;
        const existingUser = await UserRepository.findUserByEmail(email);

        if (existingUser) {
          if (existingUser.isVerified) {
            return done(null, existingUser);
          } else {
            const verifiedUser = await UserRepository.setPasswordAndVerify(
              existingUser.id,
              existingUser.password || ""
            );
            return done(null, verifiedUser);
          }
        }

        const newUserInput: TCreateUserInput = {
          email: email,
          name: profile.displayName || "Google User",
          company: "My Company",
          password: null,
          isVerified: true,
          verificationToken: null,
        };

        const newUser = await UserRepository.createUser(newUserInput);
        logger.info(`New user registered via Google: ${newUser.email}`);
        return done(null, newUser);
      } catch (error: any) {
        logger.error(`[Passport Google Strategy] Error: ${error.message}`);
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserRepository.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});