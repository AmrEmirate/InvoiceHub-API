import UserRepository from "../repositories/user.repository";
import { TCreateUserInput, TUpdateUserInput } from "../types/user.types";
import AppError from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/hash";
import { createToken } from "../utils/jwt";
import logger from "../utils/logger";
import { transport } from "../config/nodemailer";
import { generateVerificationToken } from "../utils/token";
import { User } from "../generated/prisma";
import {
  generateSetPasswordEmail,
  generateResetPasswordEmail,
} from "../utils/email-templates";

type TRegisterInput = Omit<
  TCreateUserInput,
  "password" | "verificationToken" | "isVerified"
>;

class AuthService {
  public async register(input: TRegisterInput): Promise<{ message: string }> {
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
        process.env.FE_URL || "https://invoice-hub-omega.vercel.app"
      }/auth/set-password?token=${verificationToken}`;

      await transport.sendMail({
        from: `"InvoiceHub" <${process.env.SMTP_USER}>`,
        to: createdUser.email,
        subject: "Selamat Datang! Atur Password Akun Anda",
        html: generateSetPasswordEmail(createdUser.name, setPasswordUrl),
      });

      logger.info(
        `Set password email sent to: ${createdUser.email} (ID: ${createdUser.id})`
      );
    } catch (emailError: any) {
      logger.error(
        `Failed to send 'set password' email: ${emailError.message}`
      );
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
      throw new AppError(
        400,
        "Password has already been set for this account."
      );
    }

    const hashedPassword = await hashPassword(password_plain);
    await UserRepository.setPasswordAndVerify(user.id, hashedPassword);

    logger.info(
      `Password set and user verified: ${user.email} (ID: ${user.id})`
    );
    return { message: "Password set successfully. You can now login." };
  }

  public async login(
    input: Pick<
      TRegisterInput & { password_plain: string },
      "email" | "password_plain"
    >
  ): Promise<{ user: any; token: string }> {
    const user = await UserRepository.findUserByEmail(input.email);
    if (!user) {
      logger.warn(`Login attempt failed: Email ${input.email} not found.`);
      throw new AppError(401, "Invalid email or password");
    }

    if (!user.password) {
      logger.warn(`Login attempt failed: Password not set for ${input.email}.`);
      throw new AppError(
        403,
        "Please set your password via the verification email first."
      );
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
    logger.info(
      `Profile updated for user: ${updatedUser.email} (ID: ${userId})`
    );
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

  public async googleSignup(input: {
    email: string;
    name: string;
    company: string;
  }): Promise<{ user: any; token: string }> {
    const existingUser = await UserRepository.findUserByEmail(input.email);
    if (existingUser) {
      logger.warn(
        `Google signup attempt failed: Email ${input.email} already exists.`
      );
      throw new AppError(409, "Email already registered");
    }

    const newUserInput: TCreateUserInput = {
      email: input.email,
      name: input.name,
      company: input.company,
      password: null,
      verificationToken: null,
      isVerified: true,
    };

    let createdUser;
    try {
      createdUser = await UserRepository.createUser(newUserInput);
      logger.info(
        `New user registered via Google signup: ${createdUser.email} (ID: ${createdUser.id})`
      );
    } catch (dbError: any) {
      logger.error(`Database error during Google signup: ${dbError.message}`);
      throw new AppError(500, "Failed to create user", dbError);
    }

    const tokenPayload = { id: createdUser.id, email: createdUser.email };
    const token = createToken(tokenPayload);

    const { password, ...userWithoutPassword } = createdUser;
    return { user: userWithoutPassword, token };
  }

  public async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await UserRepository.findUserByEmail(email);

    if (!user) {
      logger.warn(`Forgot password attempt for non-existent email: ${email}`);
      // For security, we don't reveal if the email exists or not
      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    if (!user.password) {
      logger.warn(
        `Forgot password attempt for user without password: ${email}`
      );
      throw new AppError(
        400,
        "Your account was created via Google. Please use Google Sign-In."
      );
    }

    // Generate reset token and set expiry (1 hour from now)
    const resetToken = generateVerificationToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await UserRepository.setResetToken(user.id, resetToken, resetTokenExpiry);

    try {
      const resetPasswordUrl = `${
        process.env.FE_URL || "https://invoice-hub-omega.vercel.app"
      }/reset-password?token=${resetToken}`;

      await transport.sendMail({
        from: `"InvoiceHub" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Reset Password - InvoiceHub",
        html: generateResetPasswordEmail(user.name, resetPasswordUrl),
      });

      logger.info(
        `Password reset email sent to: ${user.email} (ID: ${user.id})`
      );
    } catch (emailError: any) {
      logger.error(
        `Failed to send password reset email: ${emailError.message}`
      );
      throw new AppError(
        500,
        "Failed to send password reset email",
        emailError
      );
    }

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  public async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await UserRepository.findByResetToken(token);

    if (!user) {
      throw new AppError(404, "Invalid or expired reset token");
    }

    // Check if token is expired
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      throw new AppError(
        400,
        "Reset token has expired. Please request a new one."
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    await UserRepository.updatePasswordFromReset(user.id, hashedPassword);

    logger.info(
      `Password reset successful for user: ${user.email} (ID: ${user.id})`
    );
    return {
      message:
        "Password has been reset successfully. You can now login with your new password.",
    };
  }
}

export default new AuthService();
