import {
  ErrorDetails,
  ErrorCode,
  HttpStatusCode,
  ValidationErrorItem,
} from "../types/error.types";

/**
 * Custom application error class
 * Provides structured error handling with HTTP status codes and error codes
 */
class AppError extends Error {
  public readonly code: HttpStatusCode | number;
  public readonly errorCode?: ErrorCode;
  public readonly details?: ErrorDetails | ValidationErrorItem[];
  public readonly isOperational: boolean;

  /**
   * Creates a new AppError instance
   * @param code - HTTP status code
   * @param message - Error message
   * @param details - Additional error details
   * @param errorCode - Application-specific error code
   */
  constructor(
    code: HttpStatusCode | number,
    message: string,
    details?: ErrorDetails | ValidationErrorItem[],
    errorCode?: ErrorCode
  ) {
    super(message);

    this.code = code;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Creates a 400 Bad Request error
   */
  static badRequest(message: string, details?: ErrorDetails): AppError {
    return new AppError(
      HttpStatusCode.BAD_REQUEST,
      message,
      details,
      ErrorCode.INVALID_INPUT
    );
  }

  /**
   * Creates a 401 Unauthorized error
   */
  static unauthorized(message: string = "Unauthorized"): AppError {
    return new AppError(
      HttpStatusCode.UNAUTHORIZED,
      message,
      undefined,
      ErrorCode.UNAUTHORIZED
    );
  }

  /**
   * Creates a 403 Forbidden error
   */
  static forbidden(message: string = "Forbidden"): AppError {
    return new AppError(HttpStatusCode.FORBIDDEN, message);
  }

  /**
   * Creates a 404 Not Found error
   */
  static notFound(message: string = "Resource not found"): AppError {
    return new AppError(
      HttpStatusCode.NOT_FOUND,
      message,
      undefined,
      ErrorCode.RESOURCE_NOT_FOUND
    );
  }

  /**
   * Creates a 409 Conflict error
   */
  static conflict(message: string, details?: ErrorDetails): AppError {
    return new AppError(
      HttpStatusCode.CONFLICT,
      message,
      details,
      ErrorCode.RESOURCE_ALREADY_EXISTS
    );
  }

  /**
   * Creates a 500 Internal Server Error
   */
  static internal(message: string = "Internal server error"): AppError {
    return new AppError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      message,
      undefined,
      ErrorCode.INTERNAL_ERROR
    );
  }

  /**
   * Serializes error for API response (excludes stack trace in production)
   */
  toJSON(): Record<string, unknown> {
    const response: Record<string, unknown> = {
      message: this.message,
      code: this.errorCode,
    };

    if (this.details) {
      response.details = this.details;
    }

    if (process.env.NODE_ENV !== "production" && this.stack) {
      response.stack = this.stack;
    }

    return response;
  }
}

export default AppError;
