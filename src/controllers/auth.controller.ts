import { Request, Response, NextFunction } from "express";
import AuthService from "../service/auth.service";
import AppError from "../utils/AppError";
import { SafeUser } from "../types/express";
import { User } from "../generated/prisma";

interface AuthRequest extends Request {
  user?: SafeUser;
}

class AuthController {
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Hanya ambil data ini (tanpa password)
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

  /**
   * Ganti nama 'verifyEmail' menjadi 'setPassword'
   * @route POST /api/auth/set-password
   */
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

  public async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Google authentication failed");
      }

      const { user, token } = await AuthService.handleGoogleLogin(
        req.user as User
      );

      // Redirect kembali ke Frontend dengan token di URL
      // FE_URL harus ada di .env (misal: http://localhost:3000)
      const feUrl = process.env.FE_URL || "http://localhost:3000";
      
      // Kirim token dan data user sebagai query params
      const userData = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `${feUrl}/auth/callback?token=${token}&user=${userData}`
      );
    } catch (error: any) {
      next(error);
    }
  }
  // --- AKHIR TAMBAHAN ---
}

export default new AuthController();