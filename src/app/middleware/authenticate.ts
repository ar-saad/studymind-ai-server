import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";
import { fromNodeHeaders } from "better-auth/node";
import { AppError } from "../utils/AppError";

/**
 * Extends Express Request to carry the authenticated user.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    plan: string;
    image?: string | null;
  };
}

/**
 * Middleware that verifies the user's session via Better Auth
 * and attaches the user object to req.user.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      throw new AppError("Authentication required. Please log in.", 401);
    }

    // Attach user to request — cast to include custom fields
    req.user = session.user as AuthenticatedRequest["user"];
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Authentication failed.", 401));
    }
  }
};
