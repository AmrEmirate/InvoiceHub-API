import UserRepository from "../repositories/user.repository";
import RefreshTokenRepository from "../repositories/refresh-token.repository";
import { TCreateUserInput, TUpdateUserInput } from "../types/user.types";
import AppError from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  createToken,
  createRefreshToken,
  verifyRefreshToken,
  getTokenExpiryMs,
} from "../utils/jwt";
import logger from "../utils/logger";
import { transport } from "../config/nodemailer";
import { generateVerificationToken } from "../utils/token";
import { User } from "@prisma/client";
import {
  generateSetPasswordEmail,
  generateResetPasswordEmail,
} from "../utils/email-templates";

/**
 * Authentication response with tokens
 */
interface AuthTokenResponse {
  user: Omit<User, "password">;
  accessToken: string;
  refreshToken: string;
}

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
      const setPasswordUrl = `${process.env.FE_URL}/auth/set-password?token=${verificationToken}`;

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

  /**
   * Authenticates user with email and password
   * Returns access token and refresh token
   */
  public async login(
    input: Pick<
      TRegisterInput & { password_plain: string },
      "email" | "password_plain"
    >,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<AuthTokenResponse> {
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

    // Generate tokens
    const tokenPayload = { id: user.id, email: user.email };
    const accessToken = createToken(tokenPayload);
    const refreshToken = createRefreshToken(tokenPayload);

    // Store refresh token in database
    await RefreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + getTokenExpiryMs()),
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    logger.info(`User logged in: ${user.email} (ID: ${user.id})`);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
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
      const resetPasswordUrl = `${process.env.FE_URL}/reset-password?token=${resetToken}`;

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

  /**
   * Refreshes access token using a valid refresh token
   * @param token - The refresh token
   * @param metadata - Optional device/session info
   * @returns New access token and optionally new refresh token
   */
  public async refreshAccessToken(
    token: string,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    // Verify the refresh token JWT
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (error: any) {
      logger.warn(`Refresh token verification failed: ${error.message}`);
      throw new AppError(401, "Invalid or expired refresh token");
    }

    // Check if token exists in database and is valid
    const storedToken = await RefreshTokenRepository.findByToken(token);
    if (!storedToken) {
      logger.warn(`Refresh token not found or revoked for user ${decoded.id}`);
      throw new AppError(401, "Invalid or expired refresh token");
    }

    // Verify user still exists
    const user = await UserRepository.findUserById(decoded.id);
    if (!user) {
      logger.warn(`User not found for refresh token: ${decoded.id}`);
      throw new AppError(401, "User not found");
    }

    // Generate new access token
    const tokenPayload = { id: user.id, email: user.email };
    const accessToken = createToken(tokenPayload);

    // Optionally rotate refresh token (recommended for security)
    // Revoke old token and create new one
    await RefreshTokenRepository.revokeToken(token);
    const newRefreshToken = createRefreshToken(tokenPayload);
    await RefreshTokenRepository.create({
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + getTokenExpiryMs()),
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    logger.info(`Token refreshed for user: ${user.email} (ID: ${user.id})`);

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logs out user by revoking refresh token
   * @param refreshToken - The refresh token to revoke
   */
  public async logout(refreshToken: string): Promise<{ message: string }> {
    const revoked = await RefreshTokenRepository.revokeToken(refreshToken);
    if (revoked) {
      logger.info(`Refresh token revoked for logout`);
    }
    return { message: "Logged out successfully" };
  }

  /**
   * Logs out user from all devices by revoking all refresh tokens
   * @param userId - The user ID
   */
  public async logoutAllDevices(
    userId: string
  ): Promise<{ message: string; revokedCount: number }> {
    const revokedCount = await RefreshTokenRepository.revokeAllUserTokens(
      userId
    );
    logger.info(
      `All sessions revoked for user ${userId}: ${revokedCount} tokens`
    );
    return {
      message: "Logged out from all devices successfully",
      revokedCount,
    };
  }
}

export default new AuthService();
