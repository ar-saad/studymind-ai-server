import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authenticate";
import { AppError } from "../utils/AppError";

/**
 * Role-based authorization middleware.
 * Must be used AFTER `authenticate` middleware.
 *
 * @param roles - Array of allowed roles (e.g. ["ADMIN"] or ["USER", "ADMIN"])
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }

    next();
  };
};
