// File: src/middleware/validators/category.validator.ts
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

// Validator untuk CUID (ID) sudah ada di client.validator.ts
// Kita bisa impor dari sana, atau buat lagi di sini.
// Untuk kesederhanaan, kita buat lagi di sini.
export const validateIdParam = [
  param("id").isULID().withMessage("Invalid ID format"),
  handleValidationErrors,
];

export const createCategoryValidator = [
  body("name").notEmpty().withMessage("Category name is required"),
  handleValidationErrors,
];

export const updateCategoryValidator = [
  body("name").optional().notEmpty().withMessage("Category name is required"),
  handleValidationErrors,
];