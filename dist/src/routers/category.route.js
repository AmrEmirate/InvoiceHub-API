"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = __importDefault(require("../controllers/category.controller"));
const category_validator_1 = require("../middleware/validators/category.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
class CategoryRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = category_controller_1.default;
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.use(auth_middleware_1.authMiddleware);
        this.router.post("/", category_validator_1.createCategoryValidator, this.controller.create.bind(this.controller));
        this.router.get("/", category_validator_1.getCategoriesValidator, this.controller.getAll.bind(this.controller));
        this.router.get("/:id", category_validator_1.validateIdParam, this.controller.getOne.bind(this.controller));
        this.router.put("/:id", category_validator_1.validateIdParam, category_validator_1.updateCategoryValidator, this.controller.update.bind(this.controller));
        this.router.delete("/:id", category_validator_1.validateIdParam, this.controller.delete.bind(this.controller));
    }
}
exports.default = new CategoryRouter().router;
