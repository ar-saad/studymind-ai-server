import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

/**
 * Global error handler middleware.
 * Must have 4 parameters for Express to recognize it as an error handler.
 */
export const globalErrorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default to 500 for unexpected errors
  let statusCode = 500;
  let message = "Internal Server Error";
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Log non-operational (programming) errors for debugging
  if (!isOperational) {
    console.error("💥 Unexpected Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};
