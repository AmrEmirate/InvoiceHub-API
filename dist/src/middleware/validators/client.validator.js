"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientsValidator = exports.updateClientValidator = exports.createClientValidator = exports.validateIdParam = void 0;
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
exports.createClientValidator = [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Must be a valid email"),
    (0, express_validator_1.body)("phone").optional().isString().withMessage("Phone must be a string"),
    (0, express_validator_1.body)("address").optional().isString().withMessage("Address must be a string"),
    (0, express_validator_1.body)("paymentPreferences")
        .optional()
        .isString()
        .withMessage("Payment preferences must be a string"),
    handleValidationErrors,
];
exports.updateClientValidator = [
    (0, express_validator_1.body)("name").optional().notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("email").optional().isEmail().withMessage("Must be a valid email"),
    (0, express_validator_1.body)("phone").optional().isString().withMessage("Phone must be a string"),
    (0, express_validator_1.body)("address").optional().isString().withMessage("Address must be a string"),
    (0, express_validator_1.body)("paymentPreferences")
        .optional()
        .isString()
        .withMessage("Payment preferences must be a string"),
    handleValidationErrors,
];
exports.getClientsValidator = [
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
