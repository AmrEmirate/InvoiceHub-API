/**
 * Unit Tests for Authentication Service
 */
import { hashPassword, comparePassword } from "../../src/utils/hash";
import {
  createToken,
  verifyToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../src/utils/jwt";

describe("Hash Utilities", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "TestPassword123!";
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for same password", async () => {
      const password = "TestPassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should throw error for empty password", async () => {
      await expect(hashPassword("")).rejects.toThrow();
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching password", async () => {
      const password = "TestPassword123!";
      const hashed = await hashPassword(password);

      const result = await comparePassword(password, hashed);
      expect(result).toBe(true);
    });

    it("should return false for non-matching password", async () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword123!";
      const hashed = await hashPassword(password);

      const result = await comparePassword(wrongPassword, hashed);
      expect(result).toBe(false);
    });

    it("should return false for empty password", async () => {
      const hashed = await hashPassword("TestPassword123!");
      const result = await comparePassword("", hashed);
      expect(result).toBe(false);
    });

    it("should return false for empty hash", async () => {
      const result = await comparePassword("TestPassword123!", "");
      expect(result).toBe(false);
    });
  });
});

describe("JWT Utilities", () => {
  const testPayload = { id: "test-user-id", email: "test@example.com" };

  describe("createToken", () => {
    it("should create a valid access token", () => {
      const token = createToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should create different tokens for different payloads", () => {
      const token1 = createToken({ id: "user1", email: "user1@example.com" });
      const token2 = createToken({ id: "user2", email: "user2@example.com" });

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid access token", () => {
      const token = createToken(testPayload);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.type).toBe("access");
    });

    it("should throw error for invalid token", () => {
      expect(() => verifyToken("invalid-token")).toThrow();
    });

    it("should throw error for refresh token used as access token", () => {
      const refreshToken = createRefreshToken(testPayload);
      // Throws either "invalid signature" (different secrets) or "Invalid token type"
      expect(() => verifyToken(refreshToken)).toThrow();
    });
  });

  describe("createRefreshToken", () => {
    it("should create a valid refresh token", () => {
      const token = createRefreshToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a valid refresh token", () => {
      const token = createRefreshToken(testPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.type).toBe("refresh");
    });

    it("should throw error for access token used as refresh token", () => {
      const accessToken = createToken(testPayload);
      // Throws either "invalid signature" (different secrets) or "Invalid token type"
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });
});
