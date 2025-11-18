import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import UserRepository from "../repositories/user.repository";

interface JwtPayload {
  id: string;
  email: string;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AppError(401, "Access denied. Token is missing.");
    }

    let decoded;
    try {
      decoded = verifyToken(token) as JwtPayload;
    } catch (err: any) {
      logger.warn(`Invalid token received: ${err.message}`);
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