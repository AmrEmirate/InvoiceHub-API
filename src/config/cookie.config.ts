/**
 * Cookie Configuration for JWT Tokens
 * HttpOnly cookies prevent XSS attacks from accessing tokens
 */

const isProduction = process.env.NODE_ENV === "production";

/**
 * Cookie options for access token
 * Short-lived, sent on all API requests
 */
export const ACCESS_TOKEN_COOKIE = {
  name: "access_token",
  options: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  },
};

/**
 * Cookie options for refresh token
 * Long-lived, only sent to auth endpoints
 */
export const REFRESH_TOKEN_COOKIE = {
  name: "refresh_token",
  options: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth", // Only sent to auth endpoints
  },
};

/**
 * Helper to set auth cookies on response
 */
export const setAuthCookies = (
  res: any,
  accessToken: string,
  refreshToken: string
): void => {
  res.cookie(
    ACCESS_TOKEN_COOKIE.name,
    accessToken,
    ACCESS_TOKEN_COOKIE.options
  );
  res.cookie(
    REFRESH_TOKEN_COOKIE.name,
    refreshToken,
    REFRESH_TOKEN_COOKIE.options
  );
};

/**
 * Helper to clear auth cookies on logout
 */
export const clearAuthCookies = (res: any): void => {
  res.clearCookie(ACCESS_TOKEN_COOKIE.name, { path: "/" });
  res.clearCookie(REFRESH_TOKEN_COOKIE.name, { path: "/api/auth" });
};
