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

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.login({
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
}

export default new AuthController();
