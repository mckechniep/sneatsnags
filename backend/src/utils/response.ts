import { Response } from "express";
import { ApiResponse as ApiResponseType } from "../types/api";

export const successResponse = <T>(
  data: T,
  message?: string
): ApiResponseType<T> => ({
  success: true,
  data,
  message,
});

export const errorResponse = (
  message: string,
  error?: string
): ApiResponseType => ({
  success: false,
  message,
  error,
});

export class ApiResponse {
  static success<T>(res: Response, data: T, message?: string) {
    return res.json(successResponse(data, message));
  }

  static error(res: Response, message: string, statusCode = 500, error?: string) {
    return res.status(statusCode).json(errorResponse(message, error));
  }
}
