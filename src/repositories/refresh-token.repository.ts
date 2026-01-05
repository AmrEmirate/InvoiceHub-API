import { prisma } from "../config/prisma";
import { RefreshToken } from "@prisma/client";

/**
 * Repository for RefreshToken database operations
 * Handles creation, validation, and revocation of refresh tokens
 */
class RefreshTokenRepository {
  /**
   * Creates a new refresh token in the database
   * @param data - Token data including userId, token hash, and expiry
   * @returns Created refresh token record
   */
  public async create(data: {
    token: string;
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<RefreshToken> {
    return await prisma.refreshToken.create({
      data,
    });
  }

  /**
   * Finds a refresh token by its token string
   * Only returns non-revoked, non-expired tokens
   * @param token - The refresh token string
   * @returns Token record or null if not found/invalid
   */
  public async findByToken(token: string): Promise<RefreshToken | null> {
    return await prisma.refreshToken.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Revokes a specific refresh token
   * @param token - The token string to revoke
   * @returns Updated token record
   */
  public async revokeToken(token: string): Promise<RefreshToken | null> {
    try {
      return await prisma.refreshToken.update({
        where: { token },
        data: { isRevoked: true },
      });
    } catch {
      return null;
    }
  }

  /**
   * Revokes all refresh tokens for a user (logout from all devices)
   * @param userId - The user ID
   * @returns Number of tokens revoked
   */
  public async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });
    return result.count;
  }

  /**
   * Cleans up expired tokens from the database
   * Should be called periodically via cron job
   * @returns Number of tokens deleted
   */
  public async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });
    return result.count;
  }

  /**
   * Counts active sessions for a user
   * @param userId - The user ID
   * @returns Number of active refresh tokens
   */
  public async countActiveTokens(userId: string): Promise<number> {
    return await prisma.refreshToken.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Gets all active sessions for a user
   * @param userId - The user ID
   * @returns List of active refresh tokens
   */
  public async getActiveSessions(userId: string): Promise<RefreshToken[]> {
    return await prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        userId: true,
        expiresAt: true,
        createdAt: true,
        isRevoked: true,
        userAgent: true,
        ipAddress: true,
      },
    });
  }
}

export default new RefreshTokenRepository();
