"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../repositories/user.repository"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
const nodemailer_1 = require("../config/nodemailer");
const token_1 = require("../utils/token");
const email_templates_1 = require("../utils/email-templates");
class AuthService {
    async register(input) {
        const existingUser = await user_repository_1.default.findUserByEmail(input.email);
        if (existingUser) {
            logger_1.default.warn(`Registration attempt failed: Email ${input.email} already exists.`);
            throw new AppError_1.default(409, "Email already registered");
        }
        const verificationToken = (0, token_1.generateVerificationToken)();
        const newUserInput = {
            email: input.email,
            name: input.name,
            company: input.company,
            password: null,
            verificationToken: verificationToken,
            isVerified: false,
        };
        let createdUser;
        try {
            createdUser = await user_repository_1.default.createUser(newUserInput);
        }
        catch (dbError) {
            logger_1.default.error(`Database error during user creation: ${dbError.message}`);
            throw new AppError_1.default(500, "Failed to create user", dbError);
        }
        try {
            const setPasswordUrl = `${process.env.FE_URL}/auth/set-password?token=${verificationToken}`;
            await nodemailer_1.transport.sendMail({
                from: `"InvoiceHub" <${process.env.SMTP_USER}>`,
                to: createdUser.email,
                subject: "Selamat Datang! Atur Password Akun Anda",
                html: (0, email_templates_1.generateSetPasswordEmail)(createdUser.name, setPasswordUrl),
            });
            logger_1.default.info(`Set password email sent to: ${createdUser.email} (ID: ${createdUser.id})`);
        }
        catch (emailError) {
            logger_1.default.error(`Failed to send 'set password' email: ${emailError.message}`);
            throw new AppError_1.default(500, "Failed to send verification email", emailError);
        }
        return {
            message: "Registration successful. Please check your email to set your password.",
        };
    }
    async setPassword(token, password_plain) {
        const user = await user_repository_1.default.findByVerificationToken(token);
        if (!user) {
            throw new AppError_1.default(404, "Invalid or expired verification token");
        }
        if (user.isVerified || user.password) {
            throw new AppError_1.default(400, "Password has already been set for this account.");
        }
        const hashedPassword = await (0, hash_1.hashPassword)(password_plain);
        await user_repository_1.default.setPasswordAndVerify(user.id, hashedPassword);
        logger_1.default.info(`Password set and user verified: ${user.email} (ID: ${user.id})`);
        return { message: "Password set successfully. You can now login." };
    }
    async login(input) {
        const user = await user_repository_1.default.findUserByEmail(input.email);
        if (!user) {
            logger_1.default.warn(`Login attempt failed: Email ${input.email} not found.`);
            throw new AppError_1.default(401, "Invalid email or password");
        }
        if (!user.password) {
            logger_1.default.warn(`Login attempt failed: Password not set for ${input.email}.`);
            throw new AppError_1.default(403, "Please set your password via the verification email first.");
        }
        if (!user.isVerified) {
            logger_1.default.warn(`Login attempt failed: Email ${input.email} not verified.`);
            throw new AppError_1.default(403, "Please verify your email before logging in.");
        }
        const isPasswordValid = await (0, hash_1.comparePassword)(input.password_plain, user.password);
        if (!isPasswordValid) {
            logger_1.default.warn(`Login attempt failed: Invalid password for ${input.email}.`);
            throw new AppError_1.default(401, "Invalid email or password");
        }
        const tokenPayload = { id: user.id, email: user.email };
        const token = (0, jwt_1.createToken)(tokenPayload);
        logger_1.default.info(`User logged in: ${user.email} (ID: ${user.id})`);
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    async updateProfile(userId, data) {
        const updatedUser = await user_repository_1.default.updateUser(userId, data);
        logger_1.default.info(`Profile updated for user: ${updatedUser.email} (ID: ${userId})`);
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    async handleGoogleLogin(user) {
        const tokenPayload = { id: user.id, email: user.email };
        const token = (0, jwt_1.createToken)(tokenPayload);
        logger_1.default.info(`User logged in via Google: ${user.email} (ID: ${user.id})`);
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    async googleSignup(input) {
        const existingUser = await user_repository_1.default.findUserByEmail(input.email);
        if (existingUser) {
            logger_1.default.warn(`Google signup attempt failed: Email ${input.email} already exists.`);
            throw new AppError_1.default(409, "Email already registered");
        }
        const newUserInput = {
            email: input.email,
            name: input.name,
            company: input.company,
            password: null,
            verificationToken: null,
            isVerified: true,
        };
        let createdUser;
        try {
            createdUser = await user_repository_1.default.createUser(newUserInput);
            logger_1.default.info(`New user registered via Google signup: ${createdUser.email} (ID: ${createdUser.id})`);
        }
        catch (dbError) {
            logger_1.default.error(`Database error during Google signup: ${dbError.message}`);
            throw new AppError_1.default(500, "Failed to create user", dbError);
        }
        const tokenPayload = { id: createdUser.id, email: createdUser.email };
        const token = (0, jwt_1.createToken)(tokenPayload);
        const { password, ...userWithoutPassword } = createdUser;
        return { user: userWithoutPassword, token };
    }
    async forgotPassword(email) {
        const user = await user_repository_1.default.findUserByEmail(email);
        if (!user) {
            logger_1.default.warn(`Forgot password attempt for non-existent email: ${email}`);
            // For security, we don't reveal if the email exists or not
            return {
                message: "If an account with that email exists, a password reset link has been sent.",
            };
        }
        if (!user.password) {
            logger_1.default.warn(`Forgot password attempt for user without password: ${email}`);
            throw new AppError_1.default(400, "Your account was created via Google. Please use Google Sign-In.");
        }
        // Generate reset token and set expiry (1 hour from now)
        const resetToken = (0, token_1.generateVerificationToken)();
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user_repository_1.default.setResetToken(user.id, resetToken, resetTokenExpiry);
        try {
            const resetPasswordUrl = `${process.env.FE_URL}/reset-password?token=${resetToken}`;
            await nodemailer_1.transport.sendMail({
                from: `"InvoiceHub" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: "Reset Password - InvoiceHub",
                html: (0, email_templates_1.generateResetPasswordEmail)(user.name, resetPasswordUrl),
            });
            logger_1.default.info(`Password reset email sent to: ${user.email} (ID: ${user.id})`);
        }
        catch (emailError) {
            logger_1.default.error(`Failed to send password reset email: ${emailError.message}`);
            throw new AppError_1.default(500, "Failed to send password reset email", emailError);
        }
        return {
            message: "If an account with that email exists, a password reset link has been sent.",
        };
    }
    async resetPassword(token, newPassword) {
        const user = await user_repository_1.default.findByResetToken(token);
        if (!user) {
            throw new AppError_1.default(404, "Invalid or expired reset token");
        }
        // Check if token is expired
        if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
            throw new AppError_1.default(400, "Reset token has expired. Please request a new one.");
        }
        const hashedPassword = await (0, hash_1.hashPassword)(newPassword);
        await user_repository_1.default.updatePasswordFromReset(user.id, hashedPassword);
        logger_1.default.info(`Password reset successful for user: ${user.email} (ID: ${user.id})`);
        return {
            message: "Password has been reset successfully. You can now login with your new password.",
        };
    }
}
exports.default = new AuthService();
