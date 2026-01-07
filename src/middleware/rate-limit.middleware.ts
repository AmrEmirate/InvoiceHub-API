import rateLimit from "express-rate-limit";
import { Request } from "express";
import { RATE_LIMIT_CONSTANTS } from "../config/constants";

/**
 * User info for rate limiting key generation
 */
interface RateLimitUser {
  id: string;
}

/**
 * General API rate limit (by IP)
 * Applied globally to all endpoints
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONSTANTS.DEFAULT_WINDOW_MS,
  max: RATE_LIMIT_CONSTANTS.DEFAULT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

/**
 * Auth endpoints rate limit (stricter)
 * Applied to login, register, password reset endpoints
 * Uses IP address as key
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONSTANTS.AUTH_WINDOW_MS,
  max: RATE_LIMIT_CONSTANTS.AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts, please try again later",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  // Skip successful requests for login
  skipSuccessfulRequests: false,
});

/**
 * Per-user rate limit for authenticated endpoints
 * Uses user ID if authenticated, otherwise falls back to IP
 * Higher limit for authenticated users
 */
export const userLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONSTANTS.DEFAULT_WINDOW_MS,
  max:
    RATE_LIMIT_CONSTANTS.DEFAULT_MAX_REQUESTS *
    RATE_LIMIT_CONSTANTS.USER_LIMIT_MULTIPLIER,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const user = (req as Request & { user?: RateLimitUser }).user;
    // Use user ID if authenticated, otherwise IP
    return user?.id || req.ip || "unknown";
  },
  message: {
    message: "Too many requests, please try again later",
    code: "USER_RATE_LIMIT_EXCEEDED",
  },
});

/**
 * Strict rate limit for sensitive operations
 * Like password change, account deletion, etc.
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const user = (req as Request & { user?: RateLimitUser }).user;
    return user?.id || req.ip || "unknown";
  },
  message: {
    message: "Too many sensitive operations, please try again later",
    code: "STRICT_RATE_LIMIT_EXCEEDED",
  },
});
