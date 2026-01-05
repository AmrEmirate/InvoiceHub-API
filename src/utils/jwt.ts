import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

/**
 * JWT Configuration
 * All secrets MUST be set in environment variables
 */
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is not set!");
  }
  if (secret.length < 32) {
    throw new Error("FATAL: JWT_SECRET must be at least 32 characters long!");
  }
  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT_REFRESH_SECRET environment variable is not set!"
    );
  }
  return secret;
};

// Token expiry configuration
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN as string;
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN as string;

/**
 * Token payload interface
 */
export interface TokenPayload {
  id: string;
  email: string;
  type?: "access" | "refresh";
}

/**
 * Creates an access token for authentication
 * @param payload - User data to encode in token
 * @returns Signed JWT access token
 */
export const createToken = (payload: Omit<TokenPayload, "type">): string => {
  const tokenPayload: TokenPayload = { ...payload, type: "access" };
  return jwt.sign(tokenPayload, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  } as SignOptions);
};

/**
 * Creates a refresh token for token renewal
 * @param payload - User data to encode in token
 * @returns Signed JWT refresh token
 */
export const createRefreshToken = (
  payload: Omit<TokenPayload, "type">
): string => {
  const tokenPayload: TokenPayload = { ...payload, type: "refresh" };
  return jwt.sign(tokenPayload, getRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);
};

/**
 * Verifies an access token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
  if (decoded.type && decoded.type !== "access") {
    throw new Error("Invalid token type");
  }
  return decoded;
};

/**
 * Verifies a refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, getRefreshSecret()) as TokenPayload;
  if (decoded.type && decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return decoded;
};

/**
 * Decodes a token without verification (for debugging)
 * @param token - JWT token to decode
 * @returns Decoded payload or null
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Gets token expiry time in milliseconds
 * @param expiresIn - Duration string (e.g., "7d", "15m")
 * @returns Expiry time in milliseconds from now
 */
export const getTokenExpiryMs = (
  expiresIn: string = REFRESH_TOKEN_EXPIRES_IN
): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || multipliers.d);
};
