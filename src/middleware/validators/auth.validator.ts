import { body, validationResult } from "express-validator";
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

/**
 * Password complexity requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
const passwordValidator = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number")
  .matches(/[!@#$%^&*(),.?":{}|<>]/)
  .withMessage(
    'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)'
  );

export const registerValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("company")
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Company name must be between 2 and 200 characters"),
  body("email").isEmail().withMessage("Must be a valid email").normalizeEmail(),
  handleValidationErrors,
];

export const loginValidator = [
  body("email").isEmail().withMessage("Must be a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

export const setPasswordValidator = [
  body("token")
    .notEmpty()
    .withMessage("Token is required")
    .isHexadecimal()
    .withMessage("Invalid token format"),
  passwordValidator,
  handleValidationErrors,
];

export const resetPasswordValidator = [
  body("token").notEmpty().withMessage("Token is required"),
  passwordValidator,
  handleValidationErrors,
];

export const updateProfileValidator = [
  body("name")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("company")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Company cannot be empty")
    .isLength({ min: 2, max: 200 })
    .withMessage("Company name must be between 2 and 200 characters"),
  body("phone")
    .optional()
    .isString()
    .isMobilePhone("any")
    .withMessage("Must be a valid phone number"),
  body("address").optional().isString().isLength({ max: 500 }),
  body("city").optional().isString().isLength({ max: 100 }),
  body("state").optional().isString().isLength({ max: 100 }),
  body("zipCode").optional().isString().isLength({ max: 20 }),
  body("country").optional().isString().isLength({ max: 100 }),
  body("taxId").optional().isString().isLength({ max: 50 }),
  body("bankAccount").optional().isString().isLength({ max: 100 }),
  handleValidationErrors,
];

/**
 * Zod schema for password validation
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character"
  );

export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100)
      .optional(),
    company: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .max(200)
      .optional(),
    phone: z.string().optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zipCode: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
    taxId: z.string().max(50).optional(),
    bankAccount: z.string().max(100).optional(),
    avatar: z.string().url("Must be a valid URL").optional(),
  }),
});
