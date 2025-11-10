// File: src/utils/jwt.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key";
const JWT_EXPIRES_IN = "7d";

export const createToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): string | object => {
  return jwt.verify(token, JWT_SECRET);
};