// File: src/utils/token.ts
import crypto from "crypto";

/**
 * Menghasilkan token string acak yang aman
 * @param length Panjang token yang diinginkan
 * @returns Token acak
 */
export const generateVerificationToken = (length: number = 40): string => {
  return crypto.randomBytes(length).toString("hex");
};