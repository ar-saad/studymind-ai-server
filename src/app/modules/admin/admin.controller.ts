import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/apiResponse";
import { AdminService } from "./admin.service";
import {
  getUsersQuerySchema,
  updateUserPlanSchema,
  getGenerationLogsSchema,
  getTopicAnalyticsSchema,
} from "./admin.schema";
import { AuthenticatedRequest } from "../../middleware/authenticate";

export class AdminController {
  /**
   * GET /api/admin/stats
   */
  static getStats = asyncHandler(
    async (_req: AuthenticatedRequest, res: Response) => {
      const data = await AdminService.getStats();
      sendResponse({ res, message: "Admin stats retrieved", data });
    }
  );

  /**
   * GET /api/admin/users
   */
  static getUsers = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const query = getUsersQuerySchema.parse(req.query);
      const result = await AdminService.getUsers(query);
      sendResponse({
        res,
        message: "Users retrieved",
        data: result.users,
        meta: result.pagination,
      });
    }
  );

  /**
   * PUT /api/admin/users/:id/plan
   */
  static updateUserPlan = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const body = updateUserPlanSchema.parse(req.body);
      const user = await AdminService.updateUserPlan(id as string, body);
      sendResponse({ res, message: "User plan updated", data: user });
    }
  );

  /**
   * DELETE /api/admin/users/:id
   */
  static deleteUser = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      await AdminService.deleteUser(id as string);
      sendResponse({ res, message: "User deleted" });
    }
  );

  /**
   * GET /api/admin/generation-logs
   */
  static getGenerationLogs = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const query = getGenerationLogsSchema.parse(req.query);
      const result = await AdminService.getGenerationLogs(query);
      sendResponse({
        res,
        message: "Generation logs retrieved",
        data: result.logs,
        meta: result.pagination,
      });
    }
  );

  /**
   * GET /api/admin/topic-analytics
   */
  static getTopicAnalytics = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const query = getTopicAnalyticsSchema.parse(req.query);
      const data = await AdminService.getTopicAnalytics(query);
      sendResponse({
        res,
        message: "Topic analytics retrieved",
        data,
      });
    }
  );
}
