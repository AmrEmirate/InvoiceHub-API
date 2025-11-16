import { body, param, query, validationResult } from "express-validator"; // Import query
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
  param("id").isUUID().withMessage("Invalid ID format"), // Pastikan sudah isUUID
  handleValidationErrors,
];

// --- TAMBAHAN BARU ---
export const getProductsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer"),
  query("categoryId")
    .optional()
    .isUUID() // Validasi categoryId juga
    .withMessage("Invalid Category ID format"),
  handleValidationErrors,
];
// --- AKHIR TAMBAHAN ---

export const createProductValidator = [
  body("name").notEmpty().withMessage("Product name is required"),
  body("sku").notEmpty().withMessage("SKU is required"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a number"),
  body("categoryId").isUUID().withMessage("Invalid category ID format"),
  body("description").optional().isString(),
  handleValidationErrors,
];

export const updateProductValidator = [
  body("name").optional().notEmpty().withMessage("Product name is required"),
  body("price")
    .optional()
    .isNumeric()
    .withMessage("Price must be a number"),
  body("categoryId")
    .optional()
    .isUUID()
    .withMessage("Invalid category ID format"),
  body("description").optional().isString(),
  handleValidationErrors,
];