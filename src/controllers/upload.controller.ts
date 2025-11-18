import { Request, Response, NextFunction } from "express";
import UploadService from "../service/upload.service";
import AppError from "../utils/AppError";

class UploadController {
  public async handleUpload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, "Validation failed: No file uploaded.");
      }

      const fileBuffer = req.file.buffer;
      const originalName = req.file.originalname;

      const imageUrl = await UploadService.uploadImage(fileBuffer, originalName);

      res.status(201).json({
        message: "File uploaded successfully",
        data: {
          url: imageUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();