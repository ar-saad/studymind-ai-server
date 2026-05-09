import { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";
import { AppError } from "../utils/AppError";
import logger from "../config/logger";

/**
 * Global error handler middleware.
 * Must have 4 parameters for Express to recognize it as an error handler.
 */
export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
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
  } else if (err.name === "MulterError") {
    statusCode = 400;
    isOperational = true;
    if ((err as any).code === "LIMIT_FILE_SIZE") {
      message = "Image size exceeds 2MB limit";
    } else {
      message = err.message;
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Log the error with context
  const errorContext = {
    method: req.method,
    route: req.originalUrl,
    statusCode,
    userId: (req as any).user?.id || null,
    isOperational,
  };

  if (isOperational) {
    // Operational errors (expected): log at warn level
    logger.warn(`Operational error: ${message}`, errorContext);
  } else {
    // Programming/unexpected errors: log at error level with stack
    logger.error(`Unexpected error: ${message}`, {
      ...errorContext,
      stack: err.stack,
    });

    // Capture in Sentry for production monitoring
    if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
      Sentry.captureException(err, {
        extra: errorContext,
      });
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};
