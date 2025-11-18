import multer from "multer";
import AppError from "../utils/AppError";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

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

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;