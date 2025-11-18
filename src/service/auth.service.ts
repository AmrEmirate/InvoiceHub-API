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
import { User } from "../generated/prisma";

type TRegisterInput = Omit<TCreateUserInput, "password" | "verificationToken" | "isVerified">;

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

    const verificationToken = generateVerificationToken();

    const newUserInput: TCreateUserInput = {
      email: input.email,
      name: input.name,
      company: input.company,
      password: null,
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
      const setPasswordUrl = `${
        process.env.FE_URL || "http://localhost:3000"
      }/auth/set-password?token=${verificationToken}`;

      await transport.sendMail({
        from: `"InvoiceHub" <${process.env.SMTP_USER}>`,
        to: createdUser.email,
        subject: "Selamat Datang! Atur Password Akun Anda",
        html: `
          <p>Halo ${createdUser.name},</p>
          <p>Terima kasih telah mendaftar. Silakan klik link di bawah ini untuk mengatur password Anda:</p>
          <a href="${setPasswordUrl}" target="_blank">Atur Password Saya</a>
          <p>Jika Anda tidak mendaftar, abaikan email ini.</p>
        `,
      });

      logger.info(
        `Set password email sent to: ${createdUser.email} (ID: ${createdUser.id})`
      );
    } catch (emailError: any) {
      logger.error(`Failed to send 'set password' email: ${emailError.message}`);
      throw new AppError(500, "Failed to send verification email", emailError);
    }

    return {
      message:
        "Registration successful. Please check your email to set your password.",
    };
  }

  public async setPassword(
    token: string,
    password_plain: string
  ): Promise<{ message: string }> {
    const user = await UserRepository.findByVerificationToken(token);

    if (!user) {
      throw new AppError(404, "Invalid or expired verification token");
    }

    if (user.isVerified || user.password) {
       throw new AppError(400, "Password has already been set for this account.");
    }

    const hashedPassword = await hashPassword(password_plain);
    await UserRepository.setPasswordAndVerify(user.id, hashedPassword);

    logger.info(`Password set and user verified: ${user.email} (ID: ${user.id})`);
    return { message: "Password set successfully. You can now login." };
  }

  public async login(
    input: Pick<TRegisterInput & { password_plain: string }, "email" | "password_plain">
  ): Promise<{ user: any; token: string }> {
    const user = await UserRepository.findUserByEmail(input.email);
    if (!user) {
      logger.warn(`Login attempt failed: Email ${input.email} not found.`);
      throw new AppError(401, "Invalid email or password");
    }

    if (!user.password) {
        logger.warn(`Login attempt failed: Password not set for ${input.email}.`);
        throw new AppError(403, "Please set your password via the verification email first.");
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
  public async handleGoogleLogin(
    user: User
  ): Promise<{ user: any; token: string }> {
    const tokenPayload = { id: user.id, email: user.email };
    const token = createToken(tokenPayload);
    logger.info(`User logged in via Google: ${user.email} (ID: ${user.id})`);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}


export default new AuthService();