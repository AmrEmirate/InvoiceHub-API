import UserRepository from "../repositories/user.repository";
import {
  TCreateUserInput,
  TUpdateUserInput,
} from "../types/user.types";
import AppError from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/hash";
import { createToken } from "../utils/jwt";
import logger from "../utils/logger";
import { transport } from "../config/nodemailer";
import { generateVerificationToken } from "../utils/token";

type TRegisterInput = Omit<TCreateUserInput, "password"> & {
  password_plain: string;
};

class AuthService {
  public async register(
    input: TRegisterInput
  ): Promise<{ message: string }> {
    const existingUser = await UserRepository.findUserByEmail(input.email);
    if (existingUser) {
      logger.warn(
        `Registration attempt failed: Email ${input.email} already exists.`
      );
      throw new AppError(409, "Email already registered");
    }

    const hashedPassword = await hashPassword(input.password_plain);
    const verificationToken = generateVerificationToken();

    const newUserInput: TCreateUserInput & {
      verificationToken: string;
      isVerified: boolean;
    } = {
      email: input.email,
      name: input.name,
      company: input.company,
      password: hashedPassword,
      verificationToken: verificationToken,
      isVerified: false,
    };

    let createdUser;
    try {
      createdUser = await UserRepository.createUser(newUserInput);
    } catch (dbError: any) {
      logger.error(`Database error during user creation: ${dbError.message}`);
      throw new AppError(500, "Failed to create user", dbError);
    }

    try {
      const verificationUrl = `${
        process.env.API_BASE_URL || "http://localhost:8181/api"
      }/auth/verify?token=${verificationToken}`;

      await transport.sendMail({
        from: `"InvoiceHub" <${process.env.SMTP_USER}>`,
        to: createdUser.email,
        subject: "Selamat Datang! Verifikasi Akun Anda",
        html: `
          <p>Halo ${createdUser.name},</p>
          <p>Terima kasih telah mendaftar. Silakan klik link di bawah ini untuk memverifikasi email Anda:</p>
          <a href="${verificationUrl}" target="_blank">Verifikasi Akun Saya</a>
          <p>Jika Anda tidak mendaftar, abaikan email ini.</p>
        `,
      });

      logger.info(
        `Verification email sent to: ${createdUser.email} (ID: ${createdUser.id})`
      );
    } catch (emailError: any) {
      logger.error(`Failed to send verification email: ${emailError.message}`);
      throw new AppError(500, "Failed to send verification email", emailError);
    }

    return {
      message: "Registration successful. Please check your email to verify your account.",
    };
  }

  public async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await UserRepository.findByVerificationToken(token);

    if (!user) {
      throw new AppError(404, "Invalid or expired verification token");
    }

    await UserRepository.verifyUser(user.id);
    logger.info(`User verified: ${user.email} (ID: ${user.id})`);

    return { message: "Email verified successfully. You can now login." };
  }

  public async login(
    input: Pick<TRegisterInput, "email" | "password_plain">
  ): Promise<{ user: any; token: string }> {
    const user = await UserRepository.findUserByEmail(input.email);
    if (!user) {
      logger.warn(`Login attempt failed: Email ${input.email} not found.`);
      throw new AppError(401, "Invalid email or password");
    }

    if (!user.isVerified) {
      logger.warn(`Login attempt failed: Email ${input.email} not verified.`);
      throw new AppError(403, "Please verify your email before logging in.");
    }

    const isPasswordValid = await comparePassword(
      input.password_plain,
      user.password
    );
    if (!isPasswordValid) {
      logger.warn(`Login attempt failed: Invalid password for ${input.email}.`);
      throw new AppError(401, "Invalid email or password");
    }

    const tokenPayload = { id: user.id, email: user.email };
    const token = createToken(tokenPayload);
    logger.info(`User logged in: ${user.email} (ID: ${user.id})`);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  public async updateProfile(
    userId: string,
    data: TUpdateUserInput
  ): Promise<any> {
    const updatedUser = await UserRepository.updateUser(userId, data);
    logger.info(`Profile updated for user: ${updatedUser.email} (ID: ${userId})`);
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}

export default new AuthService();