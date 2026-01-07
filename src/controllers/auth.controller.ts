import { Request, Response, NextFunction } from "express";
import AuthService from "../service/auth.service";
import AppError from "../utils/AppError";
import { SafeUser } from "../types/express";
import { User } from "@prisma/client";
import {
  setAuthCookies,
  clearAuthCookies,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "../config/cookie.config";

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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Login with email and password
   * Sets HttpOnly cookies with access and refresh tokens
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

      // Set HttpOnly cookies
      setAuthCookies(res, accessToken, refreshToken);

      res.status(200).json({
        message: "User logged in successfully",
        data: {
          user,
          // Still include tokens in response for backward compatibility
          // Frontend should migrate to using cookies
          token: accessToken,
          accessToken,
          refreshToken,
        },
      });
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

      // Set HttpOnly cookie for Google login too
      res.cookie(ACCESS_TOKEN_COOKIE.name, token, ACCESS_TOKEN_COOKIE.options);

      const userDataEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `${feUrl}/auth/callback?token=${token}&user=${userDataEncoded}`
      );
    } catch (error: unknown) {
      next(error);
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const { message } = await AuthService.forgotPassword(email);
      res.status(200).json({ message });
    } catch (error: unknown) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const { message } = await AuthService.resetPassword(token, password);
      res.status(200).json({ message });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Refresh access token using refresh token from cookie or body
   * Sets new HttpOnly cookies with refreshed tokens
   */
  public async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Try to get refresh token from cookie first, then body
      const refreshToken =
        req.cookies?.[REFRESH_TOKEN_COOKIE.name] || req.body.refreshToken;

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

      // Set new HttpOnly cookies
      if (tokens.refreshToken) {
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      } else {
        res.cookie(
          ACCESS_TOKEN_COOKIE.name,
          tokens.accessToken,
          ACCESS_TOKEN_COOKIE.options
        );
      }

      res.status(200).json({
        message: "Token refreshed successfully",
        data: {
          token: tokens.accessToken,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Logout - revokes refresh token and clears cookies
   */
  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Try to get refresh token from cookie first, then body
      const refreshToken =
        req.cookies?.[REFRESH_TOKEN_COOKIE.name] || req.body.refreshToken;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      // Clear HttpOnly cookies
      clearAuthCookies(res);

      res.status(200).json({
        message: "Logged out successfully",
      });
    } catch (error: unknown) {
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

      // Clear HttpOnly cookies
      clearAuthCookies(res);

      res.status(200).json({
        message: result.message,
        data: { revokedSessions: result.revokedCount },
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export default new AuthController();
