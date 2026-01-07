import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import UserRepository from "../repositories/user.repository";
import { ACCESS_TOKEN_COOKIE } from "../config/cookie.config";

interface JwtPayload {
  id: string;
  email: string;
}

/**
 * Authentication middleware
 * Reads JWT from HttpOnly cookie first, falls back to Authorization header
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from cookie first (more secure)
    let token = req.cookies?.[ACCESS_TOKEN_COOKIE.name];

    // Fall back to Authorization header for backward compatibility
    if (!token) {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError(401, "Access denied. No token provided.");
      }

      token = authHeader.split(" ")[1];
    }

    if (!token) {
      throw new AppError(401, "Access denied. Token is missing.");
    }

    let decoded;
    try {
      decoded = verifyToken(token) as JwtPayload;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.warn(`Invalid token received: ${errorMessage}`);
      throw new AppError(401, "Invalid token.");
    }

    const user = await UserRepository.findUserById(decoded.id);

    if (!user) {
      throw new AppError(401, "Invalid token. User not found.");
    }

    const { password, ...safeUser } = user;

    req.user = safeUser;
    next();
  } catch (error) {
    next(error);
  }
};
