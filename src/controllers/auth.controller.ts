import { Request, Response, NextFunction } from "express";
import AuthService from "../service/auth.service";
import AppError from "../utils/AppError"; // Pastikan AppError diimpor
import { SafeUser } from "../types/express"; // Import SafeUser dari types/express

interface AuthRequest extends Request {
  user?: SafeUser; // Menggunakan SafeUser yang sudah didefinisikan
}

class AuthController {
  /**
   * @route POST /api/auth/register
   * @desc Register a new user
   */
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Data sudah divalidasi oleh middleware validator
      const { name, email, password, company } = req.body;

      // PERUBAHAN: 'register' sekarang hanya mengembalikan pesan
      const { message } = await AuthService.register({
        name,
        email,
        company,
        password_plain: password,
      });

      // Kembalikan pesan sukses (BUKAN token)
      res.status(201).json({
        message: message,
      });
    } catch (error: any) {
      // Teruskan error ke error handler di app.ts
      next(error);
    }
  }

  /**
   * @route GET /api/auth/verify
   * @desc Verify a new user's email
   */
  public async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query as { token: string };

      const { message } = await AuthService.verifyEmail(token);

      // Kirim response HTML sederhana agar tab browser bisa ditutup
      res.status(200).send(
        `<html><body>
           <h1>Verifikasi Berhasil!</h1>
           <p>${message}</p>
           <p>Anda bisa menutup tab ini sekarang.</p>
         </body></html>`
      );
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @route POST /api/auth/login
   * @desc Login a user
   */
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Data sudah divalidasi oleh middleware
      const { email, password } = req.body;

      // (Service 'login' sekarang punya pengecekan isVerified)
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

  /**
   * @route GET /api/auth/me
   * @desc Get current user profile
   */
  public async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // req.user diisi oleh authMiddleware
      if (!req.user) {
        throw new AppError(401, "User not authenticated");
      }

      // Kirim data user yang sudah aman (tanpa password)
      // data req.user diambil dari auth.middleware.ts
      res.status(200).json({
        message: "Profile fetched successfully",
        data: req.user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * @route PUT /api/auth/me
   * @desc Update current user profile
   */
  public async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id; // Ambil ID dari token (via authMiddleware)
      const updatedUser = await AuthService.updateProfile(userId, req.body);

      res.status(200).json({
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new AuthController();