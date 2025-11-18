import { Router } from "express";
import UploadController from "../controllers/upload.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import upload from "../middleware/multer";

class UploadRouter {
  public router: Router;
  private controller: typeof UploadController;

  constructor() {
    this.router = Router();
    this.controller = UploadController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authMiddleware);

    this.router.post(
      "/",
      upload.single("file"),
      this.controller.handleUpload.bind(this.controller)
    );
  }
}

export default new UploadRouter().router;