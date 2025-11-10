// File: src/routers/auth.route.ts
import { Router } from "express";
import AuthController from "../controllers/auth.controller";
// Import validator baru
import {
  registerValidator,
  loginValidator,
} from "../middleware/validators/auth.validator";
import { authMiddleware } from "../middleware/auth.middleware"; // Pastikan path ini benar

class AuthRouter {
  public router: Router;
  private controller: typeof AuthController;

  constructor() {
    this.router = Router();
    this.controller = AuthController;
    this.initializeRoutes();
  }

private initializeRoutes(): void {
    this.router.post(
      "/register",
      registerValidator,
      this.controller.register
    );

    this.router.post("/login", loginValidator, this.controller.login);

    // RUTE BARU YANG DIPROTEKSI
    // Middleware akan dijalankan sebelum method controller
    this.router.get("/me", authMiddleware, this.controller.getMe);
  }
}

export default new AuthRouter().router;