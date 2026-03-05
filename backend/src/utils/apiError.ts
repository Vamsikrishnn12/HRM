export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    errorCode: string,
    statusCode = 400,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // Common factory methods
  static badRequest(message: string, errorCode = 'BAD_REQUEST'): ApiError {
    return new ApiError(message, errorCode, 400);
  }

  static unauthorized(message: string, errorCode = 'UNAUTHORIZED'): ApiError {
    return new ApiError(message, errorCode, 401);
  }

  static forbidden(message: string, errorCode = 'FORBIDDEN'): ApiError {
    return new ApiError(message, errorCode, 403);
  }

  static notFound(message: string, errorCode = 'NOT_FOUND'): ApiError {
    return new ApiError(message, errorCode, 404);
  }

  static conflict(message: string, errorCode = 'CONFLICT'): ApiError {
    return new ApiError(message, errorCode, 409);
  }

  static tooManyRequests(message: string, errorCode = 'TOO_MANY_REQUESTS'): ApiError {
    return new ApiError(message, errorCode, 429);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(message, errorCode, 500, false);
  }
}
