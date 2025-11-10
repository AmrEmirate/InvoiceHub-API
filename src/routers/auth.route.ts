// File: src/routes/auth.route.ts
import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { registerValidator } from "../middleware/validators/auth.validator";

class AuthRouter {
  public router: Router;
  private controller: typeof AuthController;

  constructor() {
    this.router = Router();
    this.controller = AuthController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Terapkan validator SEBELUM controller
    this.router.post(
      "/register",
      registerValidator,
      this.controller.register
    );
  }
}

export default new AuthRouter().router;