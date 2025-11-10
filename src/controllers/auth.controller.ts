// File: src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import AuthService from "../service/auth.service";

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

  // Kita akan tambahkan login, etc. di sini nanti
}

export default new AuthController();