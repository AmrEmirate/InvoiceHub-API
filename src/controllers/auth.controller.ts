// File: src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import AuthService from "../service/auth.service";
import AppError from "../utils/AppError";

class AuthController {
  /**
   * @route POST /api/auth/register
   * @desc Register a new user
   */
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Data sudah divalidasi oleh middleware validator
      const { name, email, password, company } = req.body;

      const { user, token } = await AuthService.register({
        name,
        email,
        company,
        password_plain: password,
      });

      // Kirim response sukses
      res.status(201).json({
        message: "User registered successfully",
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      // Teruskan error ke error handler di app.ts
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Data sudah divalidasi oleh middleware
      const { email, password } = req.body;

      const { user, token } = await AuthService.login({
        email,
        password_plain: password,
      });

      // Kirim response sukses
      res.status(200).json({
        message: "User logged in successfully",
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      // Teruskan error ke error handler
      next(error);
    }
  }

  public async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user diisi oleh authMiddleware
      if (!req.user) {
        throw new AppError(401, "User not authenticated");
      }
      
      // Kirim data user yang sudah aman (tanpa password)
      res.status(200).json({
        message: "Profile fetched successfully",
        data: req.user,
      });
    } catch (error: any) {
      next(error);
    }
  }
}


export default new AuthController();