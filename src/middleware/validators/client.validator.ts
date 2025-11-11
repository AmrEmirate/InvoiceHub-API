// File: src/middleware/validators/client.validator.ts
import { body, param, validationResult } from "express-validator";
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

// Validator untuk UUID (format ID default Prisma)
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