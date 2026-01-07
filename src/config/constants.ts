/**
 * Backend Application Constants
 * Centralized location for all magic numbers and configuration values
 */

// =============================================================================
// AUTHENTICATION
// =============================================================================

export const AUTH_CONSTANTS = {
  /** Reset token expiry time in milliseconds (1 hour) */
  RESET_TOKEN_EXPIRY_MS: 60 * 60 * 1000,
  /** Verification token length in bytes */
  VERIFICATION_TOKEN_LENGTH: 32,
  /** Minimum JWT secret length */
  JWT_SECRET_MIN_LENGTH: 32,
} as const;

// =============================================================================
// VALIDATION
// =============================================================================

export const VALIDATION_CONSTANTS = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  COMPANY: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 200,
  },
  ADDRESS: {
    MAX_LENGTH: 500,
  },
  CITY: {
    MAX_LENGTH: 100,
  },
  STATE: {
    MAX_LENGTH: 100,
  },
  ZIP_CODE: {
    MAX_LENGTH: 20,
  },
  COUNTRY: {
    MAX_LENGTH: 100,
  },
  TAX_ID: {
    MAX_LENGTH: 50,
  },
  BANK_ACCOUNT: {
    MAX_LENGTH: 100,
  },
} as const;

// =============================================================================
// RATE LIMITING
// =============================================================================

export const RATE_LIMIT_CONSTANTS = {
  /** Default rate limit window in milliseconds (15 minutes) */
  DEFAULT_WINDOW_MS: 15 * 60 * 1000,
  /** Default max requests per window */
  DEFAULT_MAX_REQUESTS: 100,
  /** Auth endpoints rate limit window in milliseconds */
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  /** Auth endpoints max requests per window (stricter) */
  AUTH_MAX_REQUESTS: 10,
  /** Per-user rate limit multiplier (higher limit for authenticated users) */
  USER_LIMIT_MULTIPLIER: 2,
} as const;

// =============================================================================
// FILE UPLOAD
// =============================================================================

export const FILE_UPLOAD_CONSTANTS = {
  /** Maximum file size in bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Allowed MIME types for image uploads */
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
  /** Maximum request body size */
  MAX_BODY_SIZE: "10mb",
} as const;

// =============================================================================
// PAGINATION
// =============================================================================

export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// =============================================================================
// INVOICE
// =============================================================================

export const INVOICE_CONSTANTS = {
  /** Invoice number prefix */
  NUMBER_PREFIX: "INV",
  /** Invoice number sequence padding (4 digits) */
  SEQUENCE_PADDING: 4,
  /** Default currency */
  DEFAULT_CURRENCY: "IDR",
} as const;

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// =============================================================================
// ERROR CODES
// =============================================================================

export const ERROR_CODES = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
} as const;
