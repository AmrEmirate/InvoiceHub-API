"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("../service/auth.service"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, company } = req.body;
      const { message } = await auth_service_1.default.register({
        name,
        email,
        company,
      });
      res.status(201).json({
        message: message,
      });
    } catch (error) {
      next(error);
    }
  }
  async setPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const { message } = await auth_service_1.default.setPassword(
        token,
        password
      );
      res.status(200).json({
        message: message,
      });
    } catch (error) {
      next(error);
    }
  }
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await auth_service_1.default.login({
        email,
        password_plain: password,
      });
      res.status(200).json({
        message: "User logged in successfully",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  async getMe(req, res, next) {
    try {
      if (!req.user) {
        throw new AppError_1.default(401, "User not authenticated");
      }
      res.status(200).json({
        message: "Profile fetched successfully",
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
  async updateMe(req, res, next) {
    try {
      const userId = req.user.id;
      const updatedUser = await auth_service_1.default.updateProfile(
        userId,
        req.body
      );
      res.status(200).json({
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
  async googleSignup(req, res, next) {
    try {
      const { email, name, company } = req.body;
      const { user, token } = await auth_service_1.default.googleSignup({
        email,
        name,
        company,
      });
      res.status(201).json({
        message: "Registration with Google successful",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  async googleCallback(req, res, next) {
    try {
      if (!req.user) {
        throw new AppError_1.default(401, "Google authentication failed");
      }
      const userData = req.user;
      const feUrl =
        process.env.FE_URL || "https://invoice-hub-ashen.vercel.app";
      if (userData.isNewUser) {
        const encodedEmail = encodeURIComponent(userData.email);
        const encodedName = encodeURIComponent(userData.name);
        const encodedGoogleId = encodeURIComponent(userData.googleId);
        res.redirect(
          `${feUrl}/auth/callback?newUser=true&googleEmail=${encodedEmail}&googleName=${encodedName}&googleId=${encodedGoogleId}`
        );
        return;
      }
      const { user, token } = await auth_service_1.default.handleGoogleLogin(
        userData
      );
      const userDataEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `${feUrl}/auth/callback?token=${token}&user=${userDataEncoded}`
      );
    } catch (error) {
      next(error);
    }
  }
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const { message } = await auth_service_1.default.forgotPassword(email);
      res.status(200).json({ message });
    } catch (error) {
      next(error);
    }
  }
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const { message } = await auth_service_1.default.resetPassword(
        token,
        password
      );
      res.status(200).json({ message });
    } catch (error) {
      next(error);
    }
  }
}
exports.default = new AuthController();
