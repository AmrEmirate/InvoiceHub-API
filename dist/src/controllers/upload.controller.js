"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upload_service_1 = __importDefault(require("../service/upload.service"));
const AppError_1 = __importDefault(require("../utils/AppError"));
class UploadController {
    async handleUpload(req, res, next) {
        try {
            if (!req.file) {
                throw new AppError_1.default(400, "Validation failed: No file uploaded.");
            }
            const fileBuffer = req.file.buffer;
            const originalName = req.file.originalname;
            const imageUrl = await upload_service_1.default.uploadImage(fileBuffer, originalName);
            res.status(201).json({
                message: "File uploaded successfully",
                data: {
                    url: imageUrl,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new UploadController();
