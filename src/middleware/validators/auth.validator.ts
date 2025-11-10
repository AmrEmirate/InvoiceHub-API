// File: src/validators/auth.validator.ts
import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import AppError from "../../utils/AppError";

export const registerValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("company").notEmpty().withMessage("Company name is required"),
  body("email").isEmail().withMessage("Must be a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Kirim error validasi ke error handler
      return next(new AppError(400, "Validation failed", errors.array()));
    }
    next();
  },
];