import { Response } from 'express';

export class ApiResponse {
  static success<T>(res: Response, message: string, data?: T, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data: data ?? null,
    });
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return ApiResponse.success(res, message, data, 201);
  }

  static error(
    res: Response,
    message: string,
    errorCode: string,
    statusCode = 400,
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      errorCode,
    });
  }
}
