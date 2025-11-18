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

export const createCategoryValidator = [
  body("name").notEmpty().withMessage("Category name is required"),
  handleValidationErrors,
];

export const updateCategoryValidator = [
  body("name").optional().notEmpty().withMessage("Category name is required"),
  handleValidationErrors,
];

export const getCategoriesValidator = [
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