class AppError {
  public code: number;
  public message: string;
  public isSuccess: boolean;

  constructor(_message: string, _code: number) {
    this.message = _message;
    this.code = _code;
    this.isSuccess = false;
  }
}

export default AppError;