import crypto from "crypto";

export const generateVerificationToken = (length: number = 40): string => {
  return crypto.randomBytes(length).toString("hex");
};