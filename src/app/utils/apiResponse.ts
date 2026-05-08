import { Response } from "express";

interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
}

/**
 * Sends a standardized JSON response.
 */
export function sendResponse<T>({
  res,
  statusCode = 200,
  message = "Success",
  data,
  meta,
}: ApiResponseOptions<T>) {
  const response: Record<string, any> = {
    success: statusCode >= 200 && statusCode < 300,
    message,
  };

  if (data !== undefined) response.data = data;
  if (meta) response.meta = meta;

  res.status(statusCode).json(response);
}
