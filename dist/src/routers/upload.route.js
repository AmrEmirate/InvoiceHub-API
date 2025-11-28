"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = __importDefault(require("../controllers/upload.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = __importDefault(require("../middleware/multer"));
class UploadRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = upload_controller_1.default;
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.use(auth_middleware_1.authMiddleware);
        this.router.post("/", multer_1.default.single("file"), this.controller.handleUpload.bind(this.controller));
    }
}
exports.default = new UploadRouter().router;
