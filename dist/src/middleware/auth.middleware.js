"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
const user_repository_1 = __importDefault(require("../repositories/user.repository"));
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError_1.default(401, "Access denied. No token provided.");
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new AppError_1.default(401, "Access denied. Token is missing.");
        }
        let decoded;
        try {
            decoded = (0, jwt_1.verifyToken)(token);
        }
        catch (err) {
            logger_1.default.warn(`Invalid token received: ${err.message}`);
            throw new AppError_1.default(401, "Invalid token.");
        }
        const user = await user_repository_1.default.findUserById(decoded.id);
        if (!user) {
            throw new AppError_1.default(401, "Invalid token. User not found.");
        }
        const { password, ...safeUser } = user;
        req.user = safeUser;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
