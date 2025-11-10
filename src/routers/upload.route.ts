// File: src/routers/upload.route.ts
import { Router } from "express";
import UploadController from "../controllers/upload.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import upload from "../middleware/multer"; // Middleware multer kita

class UploadRouter {
  public router: Router;
  private controller: typeof UploadController;

  constructor() {
    this.router = Router();
    this.controller = UploadController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Terapkan authMiddleware (user harus login untuk upload)
    this.router.use(authMiddleware);

    // Endpoint POST /api/uploads
    // 1. Cek token (authMiddleware)
    // 2. Terima 1 file bernama 'file' (upload.single('file')) -> Ini juga memvalidasi
    // 3. Serahkan ke controller
    this.router.post(
      "/",
      upload.single("file"), // "file" adalah nama field di form-data
      this.controller.handleUpload.bind(this.controller)
    );
  }
}

export default new UploadRouter().router;