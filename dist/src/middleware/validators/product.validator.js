"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductValidator = exports.createProductValidator = exports.getProductsValidator = exports.validateIdParam = void 0;
const express_validator_1 = require("express-validator");
const AppError_1 = __importDefault(require("../../utils/AppError"));
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(new AppError_1.default(400, "Validation failed", errors.array()));
    }
    next();
};
exports.validateIdParam = [
    (0, express_validator_1.param)("id").isUUID().withMessage("Invalid ID format"),
    handleValidationErrors,
];
exports.getProductsValidator = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Limit must be a positive integer"),
    (0, express_validator_1.query)("categoryId")
        .optional()
        .isUUID()
        .withMessage("Invalid Category ID format"),
    handleValidationErrors,
];
exports.createProductValidator = [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Product name is required"),
    (0, express_validator_1.body)("sku").notEmpty().withMessage("SKU is required"),
    (0, express_validator_1.body)("price")
        .notEmpty()
        .withMessage("Price is required")
        .isNumeric()
        .withMessage("Price must be a number"),
    (0, express_validator_1.body)("categoryId").isUUID().withMessage("Invalid category ID format"),
    (0, express_validator_1.body)("description").optional().isString(),
    handleValidationErrors,
];
exports.updateProductValidator = [
    (0, express_validator_1.body)("name").optional().notEmpty().withMessage("Product name is required"),
    (0, express_validator_1.body)("price")
        .optional()
        .isNumeric()
        .withMessage("Price must be a number"),
    (0, express_validator_1.body)("categoryId")
        .optional()
        .isUUID()
        .withMessage("Invalid category ID format"),
    (0, express_validator_1.body)("description").optional().isString(),
    handleValidationErrors,
];
