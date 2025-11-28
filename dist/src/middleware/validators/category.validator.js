"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoriesValidator = exports.updateCategoryValidator = exports.createCategoryValidator = exports.validateIdParam = void 0;
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
exports.createCategoryValidator = [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Category name is required"),
    handleValidationErrors,
];
exports.updateCategoryValidator = [
    (0, express_validator_1.body)("name").optional().notEmpty().withMessage("Category name is required"),
    handleValidationErrors,
];
exports.getCategoriesValidator = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Limit must be a positive integer"),
    handleValidationErrors,
];
