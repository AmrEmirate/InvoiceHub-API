// File: src/middleware/multer.ts
import multer from "multer";
import AppError from "../utils/AppError";

// 1. Tentukan tipe file yang diizinkan (Validasi Ekstensi)
const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// 2. Konfigurasi file filter
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        "Validation failed: Only .jpeg, .png, .gif, or .webp files are allowed."
      )
    );
  }
};

// 3. Gunakan MemoryStorage agar file dipegang di buffer (mudah di-stream ke Cloudinary)
const storage = multer.memoryStorage();

// 4. Buat instance multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB (Validasi Ukuran File)
  },
});

export default upload;