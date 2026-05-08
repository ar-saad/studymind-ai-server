import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/apiResponse";
import { TopicService } from "./topic.service";
import { getTopicsQuerySchema, submitReviewSchema } from "./topic.schema";
import { AuthenticatedRequest } from "../../middleware/authenticate";

export class TopicController {
  /**
   * GET /api/topics
   */
  static getTopics = asyncHandler(async (req: Request, res: Response) => {
    const query = getTopicsQuerySchema.parse(req.query);
    const result = await TopicService.getTopics(query);

    sendResponse({
      res,
      message: "Topics retrieved successfully",
      data: result.topics,
      meta: result.pagination,
    });
  });

  /**
   * GET /api/topics/popular
   */
  static getPopularTopics = asyncHandler(
    async (_req: Request, res: Response) => {
      const topics = await TopicService.getPopularTopics();

      sendResponse({
        res,
        message: "Popular topics retrieved successfully",
        data: topics,
      });
    }
  );

  /**
   * GET /api/topics/categories
   */
  static getCategories = asyncHandler(
    async (_req: Request, res: Response) => {
      const categories = await TopicService.getCategories();

      sendResponse({
        res,
        message: "Categories retrieved successfully",
        data: categories,
      });
    }
  );

  /**
   * GET /api/topics/:slug
   */
  static getTopicBySlug = asyncHandler(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const topic = await TopicService.getTopicBySlug(slug as string);

    sendResponse({
      res,
      message: "Topic retrieved successfully",
      data: topic,
    });
  });

  /**
   * POST /api/topics/:id/review
   */
  static submitReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params as { id: string };
      const body = submitReviewSchema.parse(req.body);
      const review = await TopicService.submitReview(req.user!.id, id as string, body);

      sendResponse({
        res,
        statusCode: 201,
        message: "Review submitted successfully",
        data: review,
      });
    }
  );

  /**
   * GET /api/topics/:id/related
   */
  static getRelatedTopics = asyncHandler(
    async (req: Request, res: Response) => {
      const id = req.params.id as string;
      // We need to get the topic first to know its category
      const topic = await TopicService.getTopicBySlug(id as string);
      const related = await TopicService.getRelatedTopics(
        topic.id,
        topic.category
      );

      sendResponse({
        res,
        message: "Related topics retrieved successfully",
        data: related,
      });
    }
  );
}
