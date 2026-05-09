import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/apiResponse";
import { ReviewService } from "./review.service";
import {
  createReviewSchema,
  updateReviewSchema,
  getReviewsQuerySchema,
} from "./review.schema";
import { AuthenticatedRequest } from "../../middleware/authenticate";

export class ReviewController {
  /**
   * POST /api/reviews
   */
  static createReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const body = createReviewSchema.parse(req.body);
      const review = await ReviewService.createReview(req.user!.id, body);

      sendResponse({
        res,
        statusCode: 201,
        message: "Review submitted successfully",
        data: review,
      });
    },
  );

  /**
   * GET /api/reviews
   */
  static getReviews = asyncHandler(async (req: Request, res: Response) => {
    const query = getReviewsQuerySchema.parse(req.query);
    const result = await ReviewService.getReviews(query);

    sendResponse({
      res,
      message: "Reviews retrieved successfully",
      data: result.reviews,
      meta: result.pagination,
    });
  });

  /**
   * GET /api/reviews/:id
   */
  static getReviewById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const review = await ReviewService.getReviewById(id as string);

    sendResponse({
      res,
      message: "Review retrieved successfully",
      data: review,
    });
  });

  /**
   * PUT /api/reviews/:id
   */
  static updateReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const body = updateReviewSchema.parse(req.body);
      const review = await ReviewService.updateReview(
        req.user!.id,
        req.user!.role,
        id as string,
        body,
      );

      sendResponse({
        res,
        message: "Review updated successfully",
        data: review,
      });
    },
  );

  /**
   * DELETE /api/reviews/:id
   */
  static deleteReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const result = await ReviewService.deleteReview(
        req.user!.id,
        req.user!.role,
        id as string,
      );

      sendResponse({
        res,
        message: "Review deleted successfully",
        data: result,
      });
    },
  );
}
