import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/apiResponse";
import { UserService } from "./user.service";
import {
  getStudyHistorySchema,
  getQuizResultsSchema,
  updateProfileSchema,
} from "./user.schema";
import { AuthenticatedRequest } from "../../middleware/authenticate";

export class UserController {
  /**
   * GET /api/user/dashboard
   */
  static getDashboardOverview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const data = await UserService.getDashboardOverview(req.user!.id);
      sendResponse({ res, message: "Dashboard data retrieved", data });
    }
  );

  /**
   * GET /api/user/study-history
   */
  static getStudyHistory = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const query = getStudyHistorySchema.parse(req.query);
      const result = await UserService.getStudyHistory(req.user!.id, query);
      sendResponse({
        res,
        message: "Study history retrieved",
        data: result.sessions,
        meta: result.pagination,
      });
    }
  );

  /**
   * GET /api/user/quiz-results
   */
  static getQuizResults = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const query = getQuizResultsSchema.parse(req.query);
      const result = await UserService.getQuizResults(req.user!.id, query);
      sendResponse({
        res,
        message: "Quiz results retrieved",
        data: result.results,
        meta: result.pagination,
      });
    }
  );

  /**
   * GET /api/user/progress
   */
  static getProgress = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const data = await UserService.getProgress(req.user!.id);
      sendResponse({ res, message: "Progress data retrieved", data });
    }
  );

  /**
   * PUT /api/user/profile
   */
  static updateProfile = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const body = updateProfileSchema.parse(req.body);
      const user = await UserService.updateProfile(req.user!.id, body);
      sendResponse({ res, message: "Profile updated", data: user });
    }
  );

  /**
   * DELETE /api/user/account
   */
  static deleteAccount = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      await UserService.deleteAccount(req.user!.id);
      sendResponse({
        res,
        message: "Account deleted successfully",
      });
    }
  );
}
