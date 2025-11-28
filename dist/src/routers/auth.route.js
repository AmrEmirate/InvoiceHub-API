"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_validator_1 = require("../middleware/validators/auth.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const passport_1 = __importDefault(require("passport"));
class AuthRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = auth_controller_1.default;
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post("/register", auth_validator_1.registerValidator, this.controller.register.bind(this.controller));
        this.router.post("/login", auth_validator_1.loginValidator, this.controller.login.bind(this.controller));
        this.router.post("/set-password", auth_validator_1.setPasswordValidator, this.controller.setPassword.bind(this.controller));
        this.router.post("/forgot-password", this.controller.forgotPassword.bind(this.controller));
        this.router.post("/reset-password", this.controller.resetPassword.bind(this.controller));
        this.router.get("/me", auth_middleware_1.authMiddleware, this.controller.getMe.bind(this.controller));
        this.router.put("/me", auth_middleware_1.authMiddleware, auth_validator_1.updateProfileValidator, this.controller.updateMe.bind(this.controller));
        this.router.post("/google-signup", auth_validator_1.registerValidator, this.controller.googleSignup.bind(this.controller));
        this.router.get("/google", passport_1.default.authenticate("google", {
            scope: ["profile", "email"],
            session: false,
        }));
        this.router.get("/google/callback", passport_1.default.authenticate("google", {
            failureRedirect: "/login",
            session: false,
        }), this.controller.googleCallback.bind(this.controller));
    }
}
exports.default = new AuthRouter().router;
