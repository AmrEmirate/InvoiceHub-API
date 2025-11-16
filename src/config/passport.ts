import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../generated/prisma"; // Gunakan tipe dari @prisma/client
import UserRepository from "../repositories/user.repository";
import { TCreateUserInput } from "../types/user.types";
import logger from "../utils/logger";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Pastikan callbackURL ini SAMA PERSIS dengan yang ada di Google Console
      callbackURL: `${
        process.env.API_BASE_URL || "http://localhost:8181/api"
      }/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails || !profile.emails[0].value) {
          return done(new Error("Email not found in Google profile"), false);
        }

        const email = profile.emails[0].value;
        const existingUser = await UserRepository.findUserByEmail(email);

        // Kasus 1: User sudah ada
        if (existingUser) {
          // Jika user sudah terverifikasi (baik via email atau Google sebelumnya),
          // langsung izinkan login.
          if (existingUser.isVerified) {
            return done(null, existingUser);
          } else {
            // Jika user mendaftar via email tapi BELUM verifikasi,
            // kita verifikasi mereka sekarang.
            const verifiedUser = await UserRepository.setPasswordAndVerify(
              existingUser.id,
              existingUser.password || "" // Passwordnya mungkin null, tapi akan di-skip
            );
            return done(null, verifiedUser);
          }
        }

        // Kasus 2: User baru (Registrasi via Google)
        const newUserInput: TCreateUserInput = {
          email: email,
          name: profile.displayName || "Google User",
          company: "My Company", // Default, user bisa ubah di profil nanti
          password: null, // Tidak ada password
          isVerified: true, // Otomatis terverifikasi
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

// Opsional: Serial/Deserial (berguna jika menggunakan session, tapi kita pakai JWT)
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