"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const user_repository_1 = __importDefault(
  require("../repositories/user.repository")
);
const logger_1 = __importDefault(require("../utils/logger"));
passport_1.default.use(
  new passport_google_oauth20_1.Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${
        process.env.API_BASE_URL || "https://invoice-hub-api.vercel.app/api"
      }/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails || !profile.emails[0].value) {
          return done(new Error("Email not found in Google profile"), false);
        }
        const email = profile.emails[0].value;
        const existingUser = await user_repository_1.default.findUserByEmail(
          email
        );
        if (existingUser) {
          if (existingUser.isVerified) {
            return done(null, existingUser);
          } else {
            const verifiedUser =
              await user_repository_1.default.setPasswordAndVerify(
                existingUser.id,
                existingUser.password || ""
              );
            return done(null, verifiedUser);
          }
        }
        const newUserData = {
          isNewUser: true,
          email: email,
          name: profile.displayName || "Google User",
          googleId: profile.id,
        };
        logger_1.default.info(
          `New Google user detected: ${email}, redirecting to signup`
        );
        return done(null, newUserData);
      } catch (error) {
        logger_1.default.error(
          `[Passport Google Strategy] Error: ${error.message}`
        );
        return done(error, false);
      }
    }
  )
);
passport_1.default.serializeUser((user, done) => {
  done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
  try {
    const user = await user_repository_1.default.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
