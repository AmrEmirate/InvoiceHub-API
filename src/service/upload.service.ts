import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import AppError from "../utils/AppError";
import logger from "../utils/logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

class UploadService {
  public async uploadImage(
    fileBuffer: Buffer,
    originalName: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "invoicehub_uploads",
          public_id: `img_${Date.now()}_${originalName.split(".")[0]}`,
        },
        (error, result) => {
          if (error) {
            logger.error("Cloudinary upload error:", error);
            return reject(new AppError(500, "File upload failed", error));
          }
          if (!result) {
            return reject(new AppError(500, "File upload failed: No result"));
          }
          resolve(result.secure_url);
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }
}

export default new UploadService();