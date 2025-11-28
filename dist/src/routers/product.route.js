"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = __importDefault(require("../controllers/product.controller"));
const product_validator_1 = require("../middleware/validators/product.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
class ProductRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = product_controller_1.default;
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.use(auth_middleware_1.authMiddleware);
        this.router.post("/", product_validator_1.createProductValidator, this.controller.create.bind(this.controller));
        this.router.get("/", product_validator_1.getProductsValidator, this.controller.getAll.bind(this.controller));
        this.router.get("/:id", product_validator_1.validateIdParam, this.controller.getOne.bind(this.controller));
        this.router.put("/:id", product_validator_1.validateIdParam, product_validator_1.updateProductValidator, this.controller.update.bind(this.controller));
        this.router.delete("/:id", product_validator_1.validateIdParam, this.controller.delete.bind(this.controller));
    }
}
exports.default = new ProductRouter().router;
