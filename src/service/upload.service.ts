// File: src/service/upload.service.ts
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import AppError from "../utils/AppError";
import logger from "../utils/logger";

// Konfigurasi Cloudinary (menggunakan file config yang sudah kamu punya)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

class UploadService {
  /**
   * Mengunggah file buffer ke Cloudinary
   * @param fileBuffer Buffer gambar dari multer
   * @param originalName Nama asli file (untuk fallback)
   * @returns URL aman dari gambar yang diunggah
   */
  public async uploadImage(
    fileBuffer: Buffer,
    originalName: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          // Opsi upload, misal: folder, public_id unik
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

      // Ubah buffer menjadi stream dan kirim ke Cloudinary
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }
}

export default new UploadService();