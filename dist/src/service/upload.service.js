"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const streamifier_1 = __importDefault(require("streamifier"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
class UploadService {
    async uploadImage(fileBuffer, originalName) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: "invoicehub_uploads",
                public_id: `img_${Date.now()}_${originalName
                    .split(".")[0]
                    .replace(/[^a-zA-Z0-9]/g, "")}`,
            }, (error, result) => {
                if (error) {
                    logger_1.default.error("Cloudinary upload error:", error);
                    return reject(new AppError_1.default(500, "File upload failed", error));
                }
                if (!result) {
                    return reject(new AppError_1.default(500, "File upload failed: No result"));
                }
                resolve(result.secure_url);
            });
            streamifier_1.default.createReadStream(fileBuffer).pipe(uploadStream);
        });
    }
}
exports.default = new UploadService();
