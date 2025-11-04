import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { uploaderMemory } from '../middleware/uploader';

class AuthRouter {
  private route: Router;
  private authController: AuthController;

  constructor() {
    this.route = Router();
    this.authController = new AuthController();
    this.initializeRoute();
  }

  private initializeRoute(): void {
    this.route.patch(
      '/profile-img',
      uploaderMemory().single('img'), // 'img' adalah nama field di form-data
      this.authController.changeProfileImg
    );
  }

  public getRouter(): Router {
    return this.route;
  }
}

export default AuthRouter;