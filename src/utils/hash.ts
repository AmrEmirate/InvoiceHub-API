import { hash, compare } from "bcryptjs";

/**
 * Salt rounds for bcrypt hashing
 * Higher values = more secure but slower
 * Recommended: 10-12 for production
 */
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password) {
    throw new Error("Password is required for hashing");
  }
  return await hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  if (!password || !hashedPassword) {
    return false;
  }
  return await compare(password, hashedPassword);
};
