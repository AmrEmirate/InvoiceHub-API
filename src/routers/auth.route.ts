// File: src/routers/auth.route.ts
import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  verifyEmailValidator, // <-- 1. Impor validator baru
} from "../middleware/validators/auth.validator";
import { authMiddleware } from "../middleware/auth.middleware";

class AuthRouter {
  public router: Router;
  private controller: typeof AuthController;

  constructor() {
    this.router = Router();
    this.controller = AuthController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // ... (route register, login) ...
    this.router.post(
      "/register",
      registerValidator,
      this.controller.register.bind(this.controller)
    );
    this.router.post(
      "/login",
      loginValidator,
      this.controller.login.bind(this.controller)
    );

    // --- 2. TAMBAHKAN RUTE BARU ---
    // Rute ini publik (tanpa authMiddleware) karena user belum login
    this.router.get(
      "/verify",
      verifyEmailValidator, // Validasi query 'token'
      this.controller.verifyEmail.bind(this.controller)
    );
    // --- AKHIR RUTE BARU ---

    // ... (route /me GET dan PUT) ...
    this.router.get(
      "/me",
      authMiddleware,
      this.controller.getMe.bind(this.controller)
    );
    this.router.put(
      "/me",
      authMiddleware,
      updateProfileValidator,
      this.controller.updateMe.bind(this.controller)
    );
  }
}

export default new AuthRouter().router;