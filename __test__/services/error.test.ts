/**
 * Unit Tests for AppError Class
 */
import AppError from "../../src/utils/AppError";
import { HttpStatusCode, ErrorCode } from "../../src/types/error.types";

describe("AppError", () => {
  describe("constructor", () => {
    it("should create an error with code and message", () => {
      const error = new AppError(400, "Bad Request");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(400);
      expect(error.message).toBe("Bad Request");
      expect(error.isOperational).toBe(true);
    });

    it("should create an error with details", () => {
      const details = { field: "email", constraint: "required" };
      const error = new AppError(400, "Validation failed", details);

      expect(error.details).toEqual(details);
    });

    it("should create an error with error code", () => {
      const error = new AppError(
        401,
        "Unauthorized",
        undefined,
        ErrorCode.UNAUTHORIZED
      );

      expect(error.errorCode).toBe(ErrorCode.UNAUTHORIZED);
    });
  });

  describe("static factory methods", () => {
    it("should create badRequest error", () => {
      const error = AppError.badRequest("Invalid input");

      expect(error.code).toBe(HttpStatusCode.BAD_REQUEST);
      expect(error.message).toBe("Invalid input");
      expect(error.errorCode).toBe(ErrorCode.INVALID_INPUT);
    });

    it("should create unauthorized error", () => {
      const error = AppError.unauthorized();

      expect(error.code).toBe(HttpStatusCode.UNAUTHORIZED);
      expect(error.message).toBe("Unauthorized");
      expect(error.errorCode).toBe(ErrorCode.UNAUTHORIZED);
    });

    it("should create unauthorized error with custom message", () => {
      const error = AppError.unauthorized("Token expired");

      expect(error.message).toBe("Token expired");
    });

    it("should create forbidden error", () => {
      const error = AppError.forbidden();

      expect(error.code).toBe(HttpStatusCode.FORBIDDEN);
      expect(error.message).toBe("Forbidden");
    });

    it("should create notFound error", () => {
      const error = AppError.notFound();

      expect(error.code).toBe(HttpStatusCode.NOT_FOUND);
      expect(error.message).toBe("Resource not found");
      expect(error.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    });

    it("should create conflict error", () => {
      const error = AppError.conflict("Email already exists");

      expect(error.code).toBe(HttpStatusCode.CONFLICT);
      expect(error.message).toBe("Email already exists");
      expect(error.errorCode).toBe(ErrorCode.RESOURCE_ALREADY_EXISTS);
    });

    it("should create internal error", () => {
      const error = AppError.internal();

      expect(error.code).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe("Internal server error");
      expect(error.errorCode).toBe(ErrorCode.INTERNAL_ERROR);
    });
  });

  describe("toJSON", () => {
    it("should serialize error to JSON", () => {
      const error = new AppError(
        400,
        "Bad Request",
        undefined,
        ErrorCode.INVALID_INPUT
      );
      const json = error.toJSON();

      expect(json.message).toBe("Bad Request");
      expect(json.code).toBe(ErrorCode.INVALID_INPUT);
    });

    it("should include details in JSON", () => {
      const details = { field: "email" };
      const error = new AppError(400, "Validation failed", details);
      const json = error.toJSON();

      expect(json.details).toEqual(details);
    });

    it("should include stack in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new AppError(500, "Server error");
      const json = error.toJSON();

      expect(json.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it("should exclude stack in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new AppError(500, "Server error");
      const json = error.toJSON();

      expect(json.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
