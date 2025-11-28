"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new AppError_1.default(400, "Validation failed: Only .jpeg, .png, .gif, or .webp files are allowed."));
    }
};
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
exports.default = upload;
