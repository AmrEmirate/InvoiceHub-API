import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  setPasswordValidator,
} from "../middleware/validators/auth.validator";
import { authMiddleware } from "../middleware/auth.middleware";
import passport from "passport";

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
      this.controller.register.bind(this.controller)
    );

    this.router.post(
      "/login",
      loginValidator,
      this.controller.login.bind(this.controller)
    );

    this.router.post(
      "/set-password",
      setPasswordValidator,
      this.controller.setPassword.bind(this.controller)
    );

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

    this.router.post(
      "/google-signup",
      registerValidator,
      this.controller.googleSignup.bind(this.controller)
    );

    this.router.get(
      "/google",
      passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
      })
    );

    this.router.get(
      "/google/callback",
      passport.authenticate("google", {
        failureRedirect: "/login",
        session: false,
      }),
      this.controller.googleCallback.bind(this.controller)
    );
  }

}

export default new AuthRouter().router;