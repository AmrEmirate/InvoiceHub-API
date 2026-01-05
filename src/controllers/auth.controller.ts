import { Request, Response, NextFunction } from "express";
import AuthService from "../service/auth.service";
import AppError from "../utils/AppError";
import { SafeUser } from "../types/express";
import { User } from "@prisma/client";

interface AuthRequest extends Request {
  user?: SafeUser;
}

class AuthController {
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, company } = req.body;

      const { message } = await AuthService.register({
        name,
        email,
        company,
      });

      res.status(201).json({
        message: message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  public async setPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      const { message } = await AuthService.setPassword(token, password);

      res.status(200).json({
        message: message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Login with email and password
   * Returns access token and refresh token
   */
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const metadata = {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.socket.remoteAddress,
      };

      const { user, accessToken, refreshToken } = await AuthService.login(
        { email, password_plain: password },
        metadata
      );

      res.status(200).json({
        message: "User logged in successfully",
        data: {
          user,
          token: accessToken, // Keep 'token' for backward compatibility
          accessToken,
          refreshToken,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  public async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "User not authenticated");
      }
      res.status(200).json({
        message: "Profile fetched successfully",
        data: req.user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  public async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const updatedUser = await AuthService.updateProfile(userId, req.body);
      res.status(200).json({
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      next(error);
    }
  }

  public async googleSignup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, company } = req.body;

      const { user, token } = await AuthService.googleSignup({
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
    } catch (error: any) {
      next(error);
    }
  }

  public async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Google authentication failed");
      }

      const userData = req.user as any;
      const feUrl = process.env.FE_URL;

      if (userData.isNewUser) {
        const encodedEmail = encodeURIComponent(userData.email);
        const encodedName = encodeURIComponent(userData.name);
        const encodedGoogleId = encodeURIComponent(userData.googleId);

        res.redirect(
          `${feUrl}/auth/callback?newUser=true&googleEmail=${encodedEmail}&googleName=${encodedName}&googleId=${encodedGoogleId}`
        );
        return;
      }

      const { user, token } = await AuthService.handleGoogleLogin(
        userData as User
      );

      const userDataEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `${feUrl}/auth/callback?token=${token}&user=${userDataEncoded}`
      );
    } catch (error: any) {
      next(error);
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const { message } = await AuthService.forgotPassword(email);
      res.status(200).json({ message });
    } catch (error: any) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const { message } = await AuthService.resetPassword(token, password);
      res.status(200).json({ message });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError(400, "Refresh token is required");
      }

      const metadata = {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.socket.remoteAddress,
      };

      const tokens = await AuthService.refreshAccessToken(
        refreshToken,
        metadata
      );

      res.status(200).json({
        message: "Token refreshed successfully",
        data: {
          token: tokens.accessToken, // Backward compatibility
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Logout - revokes refresh token
   */
  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      res.status(200).json({
        message: "Logged out successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Logout from all devices
   */
  public async logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await AuthService.logoutAllDevices(userId);

      res.status(200).json({
        message: result.message,
        data: { revokedSessions: result.revokedCount },
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new AuthController();
