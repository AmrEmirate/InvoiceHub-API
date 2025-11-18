import { body, param, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import AppError from "../../utils/AppError";

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

export const createClientValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Must be a valid email"),
  body("phone").optional().isString().withMessage("Phone must be a string"),
  body("address").optional().isString().withMessage("Address must be a string"),
  body("paymentPreferences")
    .optional()
    .isString()
    .withMessage("Payment preferences must be a string"),
  handleValidationErrors,
];

export const updateClientValidator = [
  body("name").optional().notEmpty().withMessage("Name is required"),
  body("email").optional().isEmail().withMessage("Must be a valid email"),
  body("phone").optional().isString().withMessage("Phone must be a string"),
  body("address").optional().isString().withMessage("Address must be a string"),
  body("paymentPreferences")
    .optional()
    .isString()
    .withMessage("Payment preferences must be a string"),
  handleValidationErrors,
];

export const getClientsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer"),
  handleValidationErrors,
];