import { Request, Response, NextFunction } from "express";

/**
 * Wraps an async Express route handler to catch errors and pass them to
 * the global error handler via next(), eliminating repetitive try/catch blocks.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
