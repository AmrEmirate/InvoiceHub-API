import { z } from "zod";
import { validate } from "../validate.middleware";
import { VALIDATION_CONSTANTS } from "../../config/constants";

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/**
 * Password complexity requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const passwordSchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH,
    `Password must be at least ${VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH} characters`
  )
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character"
  );

/**
 * Email schema with normalization
 */
export const emailSchema = z
  .string()
  .email("Must be a valid email")
  .transform((email) => email.toLowerCase().trim());

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.NAME.MIN_LENGTH,
    `Name must be at least ${VALIDATION_CONSTANTS.NAME.MIN_LENGTH} characters`
  )
  .max(
    VALIDATION_CONSTANTS.NAME.MAX_LENGTH,
    `Name must be at most ${VALIDATION_CONSTANTS.NAME.MAX_LENGTH} characters`
  );

/**
 * Company validation schema
 */
export const companySchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.COMPANY.MIN_LENGTH,
    `Company name must be at least ${VALIDATION_CONSTANTS.COMPANY.MIN_LENGTH} characters`
  )
  .max(
    VALIDATION_CONSTANTS.COMPANY.MAX_LENGTH,
    `Company name must be at most ${VALIDATION_CONSTANTS.COMPANY.MAX_LENGTH} characters`
  );

// =============================================================================
// REQUEST BODY SCHEMAS
// =============================================================================

/**
 * Registration request body schema
 */
export const registerBodySchema = z.object({
  name: nameSchema,
  email: emailSchema,
  company: companySchema,
});

/**
 * Login request body schema
 */
export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Set password request body schema
 */
export const setPasswordBodySchema = z.object({
  token: z
    .string()
    .min(1, "Token is required")
    .regex(/^[a-f0-9]+$/i, "Invalid token format"),
  password: passwordSchema,
});

/**
 * Reset password request body schema
 */
export const resetPasswordBodySchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

/**
 * Forgot password request body schema
 */
export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
});

/**
 * Update profile request body schema
 */
export const updateProfileBodySchema = z.object({
  name: nameSchema.optional(),
  company: companySchema.optional(),
  phone: z.string().optional(),
  address: z.string().max(VALIDATION_CONSTANTS.ADDRESS.MAX_LENGTH).optional(),
  city: z.string().max(VALIDATION_CONSTANTS.CITY.MAX_LENGTH).optional(),
  state: z.string().max(VALIDATION_CONSTANTS.STATE.MAX_LENGTH).optional(),
  zipCode: z.string().max(VALIDATION_CONSTANTS.ZIP_CODE.MAX_LENGTH).optional(),
  country: z.string().max(VALIDATION_CONSTANTS.COUNTRY.MAX_LENGTH).optional(),
  taxId: z.string().max(VALIDATION_CONSTANTS.TAX_ID.MAX_LENGTH).optional(),
  bankAccount: z
    .string()
    .max(VALIDATION_CONSTANTS.BANK_ACCOUNT.MAX_LENGTH)
    .optional(),
  avatar: z.string().url("Must be a valid URL").optional(),
});

/**
 * Google signup request body schema
 */
export const googleSignupBodySchema = z.object({
  email: emailSchema,
  name: nameSchema,
  company: companySchema,
});

/**
 * Refresh token request body schema
 */
export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/**
 * Logout request body schema
 */
export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// =============================================================================
// VALIDATION MIDDLEWARES
// =============================================================================

export const registerValidator = validate({ body: registerBodySchema });
export const loginValidator = validate({ body: loginBodySchema });
export const setPasswordValidator = validate({ body: setPasswordBodySchema });
export const resetPasswordValidator = validate({
  body: resetPasswordBodySchema,
});
export const forgotPasswordValidator = validate({
  body: forgotPasswordBodySchema,
});
export const updateProfileValidator = validate({
  body: updateProfileBodySchema,
});
export const googleSignupValidator = validate({ body: googleSignupBodySchema });
export const refreshTokenValidator = validate({ body: refreshTokenBodySchema });
export const logoutValidator = validate({ body: logoutBodySchema });
