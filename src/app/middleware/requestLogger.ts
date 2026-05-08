import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

/**
 * Middleware that logs every API request with method, route,
 * status code, response time, and user ID (if authenticated).
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Log after response is sent
  res.on("finish", () => {
    const duration = Date.now() - start;
    const user = (req as any).user;

    logger.info("API Request", {
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: duration,
      userId: user?.id || null,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  });

  next();
};
