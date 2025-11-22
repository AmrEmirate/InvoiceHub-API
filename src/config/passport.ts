import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../generated/prisma";
import UserRepository from "../repositories/user.repository";
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
          // User already exists, allow login
          if (existingUser.isVerified) {
            return done(null, existingUser);
          } else {
            // Verify user if not already verified
            const verifiedUser = await UserRepository.setPasswordAndVerify(
              existingUser.id,
              existingUser.password || ""
            );
            return done(null, verifiedUser);
          }
        }

        // User doesn't exist - return profile data with flag
        // Controller will redirect to signup page
        const newUserData = {
          isNewUser: true,
          email: email,
          name: profile.displayName || "Google User",
          googleId: profile.id,
        };
        
        logger.info(`New Google user detected: ${email}, redirecting to signup`);
        return done(null, newUserData as any);
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