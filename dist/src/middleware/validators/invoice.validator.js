"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoicesValidator = exports.updateInvoiceStatusValidator = exports.createInvoiceValidatorV2 = exports.validateIdParam = void 0;
const express_validator_1 = require("express-validator");
const AppError_1 = __importDefault(require("../../utils/AppError"));
const prisma_1 = require("../../generated/prisma");
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
exports.createInvoiceValidatorV2 = [
    (0, express_validator_1.body)("clientId").isUUID().withMessage("Invalid client ID format"),
    (0, express_validator_1.body)("invoiceNumber").optional(),
    (0, express_validator_1.body)("dueDate").isISO8601().toDate().withMessage("Invalid due date"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(Object.values(prisma_1.InvoiceStatus))
        .withMessage("Invalid status"),
    (0, express_validator_1.body)("items")
        .isArray({ min: 1 })
        .withMessage("Invoice must have at least one item"),
    (0, express_validator_1.body)("items.*.description")
        .notEmpty()
        .withMessage("Item description is required"),
    (0, express_validator_1.body)("items.*.quantity")
        .isInt({ min: 1 })
        .withMessage("Item quantity must be a positive integer"),
    (0, express_validator_1.body)("items.*.price")
        .isNumeric()
        .withMessage("Item price must be a number"),
    (0, express_validator_1.body)("items.*.productId")
        .optional()
        .isUUID()
        .withMessage("Invalid product ID format"),
    handleValidationErrors,
];
exports.updateInvoiceStatusValidator = [
    (0, express_validator_1.body)("status")
        .isIn(Object.values(prisma_1.InvoiceStatus))
        .withMessage("Invalid status"),
    handleValidationErrors,
];
exports.getInvoicesValidator = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Limit must be a positive integer"),
    (0, express_validator_1.query)("status")
        .optional()
        .isIn(Object.values(prisma_1.InvoiceStatus))
        .withMessage("Invalid status value"),
    (0, express_validator_1.query)("clientId")
        .optional()
        .isUUID()
        .withMessage("Invalid Client ID format"),
    handleValidationErrors,
];
