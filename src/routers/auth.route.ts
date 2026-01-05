import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  setPasswordValidator,
  resetPasswordValidator,
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

    this.router.post(
      "/forgot-password",
      this.controller.forgotPassword.bind(this.controller)
    );

    this.router.post(
      "/reset-password",
      resetPasswordValidator,
      this.controller.resetPassword.bind(this.controller)
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

    // Token refresh - no auth required, uses refresh token
    this.router.post(
      "/refresh-token",
      this.controller.refreshToken.bind(this.controller)
    );

    // Logout - revokes refresh token
    this.router.post("/logout", this.controller.logout.bind(this.controller));

    // Logout from all devices - requires authentication
    this.router.post(
      "/logout-all",
      authMiddleware,
      this.controller.logoutAll.bind(this.controller)
    );
  }
}

export default new AuthRouter().router;
