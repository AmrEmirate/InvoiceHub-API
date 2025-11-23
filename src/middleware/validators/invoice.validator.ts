import { body, param, query, validationResult } from "express-validator";
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

export const createInvoiceValidatorV2 = [
  body("clientId").isUUID().withMessage("Invalid client ID format"),
  body("invoiceNumber").optional(),
  body("dueDate").isISO8601().toDate().withMessage("Invalid due date"),
  body("status")
    .optional()
    .isIn(Object.values(InvoiceStatus))
    .withMessage("Invalid status"),

  body("items")
    .isArray({ min: 1 })
    .withMessage("Invoice must have at least one item"),
  
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

export const getInvoicesValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer"),
  query("status")
    .optional()
    .isIn(Object.values(InvoiceStatus))
    .withMessage("Invalid status value"),
  query("clientId")
    .optional()
    .isUUID()
    .withMessage("Invalid Client ID format"),
  handleValidationErrors,
];