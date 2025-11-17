import { body, validationResult, query } from "express-validator";
import { Request, Response, NextFunction } from "express";
import AppError from "../../utils/AppError";
import { z } from "zod";

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

export const registerValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("company").notEmpty().withMessage("Company name is required"),
  body("email").isEmail().withMessage("Must be a valid email"),
  // HAPUS validasi password dari sini
  handleValidationErrors,
];

export const loginValidator = [
  body("email").isEmail().withMessage("Must be a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// GANTI NAMA DARI 'verifyEmailValidator'
export const setPasswordValidator = [
  body("token")
    .notEmpty()
    .withMessage("Token is required")
    .isHexadecimal()
    .withMessage("Invalid token format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
];

export const updateProfileValidator = [
  body("name").optional().isString().notEmpty().withMessage("Name cannot be empty"),
  body("company")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Company cannot be empty"),
  body("phone").optional().isString(),
  body("address").optional().isString(),
  body("city").optional().isString(),
  body("state").optional().isString(),
  body("zipCode").optional().isString(),
  body("country").optional().isString(),
  body("taxId").optional().isString(),
  body("bankAccount").optional().isString(),
  handleValidationErrors,
];

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name is required'),
    company: z.string().min(3, 'Company name is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    taxId: z.string().optional(),
    bankAccount: z.string().optional(),
    avatar: z.string().url('Must be a valid URL').optional(), // <-- TAMBAHKAN INI
  }),
});