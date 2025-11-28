"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.updateProfileValidator = exports.setPasswordValidator = exports.loginValidator = exports.registerValidator = void 0;
const express_validator_1 = require("express-validator");
const AppError_1 = __importDefault(require("../../utils/AppError"));
const zod_1 = require("zod");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(new AppError_1.default(400, "Validation failed", errors.array()));
    }
    next();
};
exports.registerValidator = [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("company").notEmpty().withMessage("Company name is required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Must be a valid email"),
    handleValidationErrors,
];
exports.loginValidator = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Must be a valid email"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
];
exports.setPasswordValidator = [
    (0, express_validator_1.body)("token")
        .notEmpty()
        .withMessage("Token is required")
        .isHexadecimal()
        .withMessage("Invalid token format"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    handleValidationErrors,
];
exports.updateProfileValidator = [
    (0, express_validator_1.body)("name").optional().isString().notEmpty().withMessage("Name cannot be empty"),
    (0, express_validator_1.body)("company")
        .optional()
        .isString()
        .notEmpty()
        .withMessage("Company cannot be empty"),
    (0, express_validator_1.body)("phone").optional().isString(),
    (0, express_validator_1.body)("address").optional().isString(),
    (0, express_validator_1.body)("city").optional().isString(),
    (0, express_validator_1.body)("state").optional().isString(),
    (0, express_validator_1.body)("zipCode").optional().isString(),
    (0, express_validator_1.body)("country").optional().isString(),
    (0, express_validator_1.body)("taxId").optional().isString(),
    (0, express_validator_1.body)("bankAccount").optional().isString(),
    handleValidationErrors,
];
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(3, 'Name is required'),
        company: zod_1.z.string().min(3, 'Company name is required'),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        zipCode: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        taxId: zod_1.z.string().optional(),
        bankAccount: zod_1.z.string().optional(),
        avatar: zod_1.z.string().url('Must be a valid URL').optional(),
    }),
});
