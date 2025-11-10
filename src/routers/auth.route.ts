import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import {
  registerValidator,
  loginValidator,
  updateProfileValidator, // <-- 1. IMPORT VALIDATOR BARU
} from "../middleware/validators/auth.validator";
import { authMiddleware } from "../middleware/auth.middleware";

class AuthRouter {
  public router: Router;
  private controller: typeof AuthController;

  constructor() {
    this.router = Router();
    this.controller = AuthController; // Pastikan ini sudah diperbaiki (tanpa 'new')
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Rute publik (tanpa authMiddleware)
    this.router.post(
      "/register",
      registerValidator,
      this.controller.register.bind(this.controller) // .bind() untuk controller
    );

    this.router.post(
      "/login",
      loginValidator,
      this.controller.login.bind(this.controller) // .bind() untuk controller
    );

    // Rute yang dilindungi (membutuhkan authMiddleware)
    this.router.get(
      "/me",
      authMiddleware, // Dilindungi
      this.controller.getMe.bind(this.controller)
    );

    // 2. RUTE BARU YANG DITAMBAHKAN
    this.router.put(
      "/me",
      authMiddleware, // Dilindungi
      updateProfileValidator, // Validasi input update
      this.controller.updateMe.bind(this.controller) // .bind() untuk controller
    );
  }
}

export default new AuthRouter().router;