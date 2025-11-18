class AppError extends Error {
  public code: number;
  public details?: any;

  constructor(
    code: number,
    message: string,
    details?: any,
    stack: string = ""
  ) {
    super(message);
    this.code = code;
    this.details = details;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;