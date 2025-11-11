// File: src/middleware/validators/invoice.validator.ts
import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import AppError from "../../utils/AppError";
import { InvoiceStatus } from "../../generated/prisma";

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(400, "Validation failed", errors.array()));
  }
  next();
};
    
export const validateIdParam = [
  param("id").isUUID().withMessage("Invalid ID format"),
  handleValidationErrors,
];

export const createInvoiceValidator = [
  body("clientId").isUUID().withMessage("Invalid client ID format"),
  body("invoiceNumber").notEmpty().withMessage("Invoice number is required"),
  body("dueDate").isISO8601().toDate().withMessage("Invalid due date"),
  body("status")
    .optional()
    .isIn(Object.values(InvoiceStatus))
    .withMessage("Invalid status"),

  // Validasi Array 'items'
  body("items")
    .isArray({ min: 1 })
    .withMessage("Invoice must have at least one item"),
  
  // Validasi setiap objek di dalam array 'items'
  body("items.*.description")
    .notEmpty()
    .withMessage("Item description is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be a positive integer"),
  body("items.*.price")
    .isNumeric()
    .withMessage("Item price must be a number"),
  body("items.*.productId")
    .optional()
    .isUUID()
    .withMessage("Invalid product ID format"),

  handleValidationErrors,
];

export const updateInvoiceStatusValidator = [
  body("status")
    .isIn(Object.values(InvoiceStatus))
    .withMessage("Invalid status"),
  handleValidationErrors,
];