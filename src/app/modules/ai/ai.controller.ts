import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/apiResponse";
import { AIService } from "./ai.service";
import {
  studyGuideSchema,
  quizSchema,
  chatSchema,
  createTopicAISchema,
  saveQuizResultSchema,
  createStudySessionSchema,
} from "./ai.schema";
import { AuthenticatedRequest } from "../../middleware/authenticate";

export class AIController {
  /**
   * POST /api/ai/study-guide
   * Generate an AI study guide for a topic.
   */
  static generateStudyGuide = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const input = studyGuideSchema.parse(req.body);
      const result = await AIService.generateStudyGuide(req.user!.id, input);

      sendResponse({
        res,
        message: "Study guide generated successfully",
        data: result,
      });
    }
  );

  /**
   * POST /api/ai/quiz
   * Generate an AI quiz for a topic.
   */
  static generateQuiz = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const input = quizSchema.parse(req.body);
      const result = await AIService.generateQuiz(req.user!.id, input);

      sendResponse({
        res,
        message: "Quiz generated successfully",
        data: result,
      });
    }
  );

  /**
   * POST /api/ai/chat
   * Send a message to the AI doubt solver.
   */
  static chat = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const input = chatSchema.parse(req.body);
      const result = await AIService.chat(req.user!.id, input);

      sendResponse({
        res,
        message: "Chat response generated",
        data: result,
      });
    }
  );

  /**
   * POST /api/topics/create
   * Create a new topic via AI generation.
   */
  static createTopic = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const input = createTopicAISchema.parse(req.body);
      const result = await AIService.createTopic(req.user!.id, input);

      sendResponse({
        res,
        statusCode: 201,
        message: "Your topic has been created!",
        data: result,
      });
    }
  );

  /**
   * POST /api/ai/quiz-result
   * Save quiz results.
   */
  static saveQuizResult = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const input = saveQuizResultSchema.parse(req.body);
      const result = await AIService.saveQuizResult(req.user!.id, input);

      sendResponse({
        res,
        statusCode: 201,
        message: "Quiz result saved",
        data: result,
      });
    }
  );

  /**
   * POST /api/ai/study-session
   * Create a new study session.
   */
  static createStudySession = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const input = createStudySessionSchema.parse(req.body);
      const result = await AIService.createStudySession(
        req.user!.id,
        input.topicId
      );

      sendResponse({
        res,
        statusCode: 201,
        message: "Study session created",
        data: result,
      });
    }
  );

  /**
   * GET /api/ai/usage
   * Get current usage stats for the authenticated user.
   */
  static getUsage = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const usage = await AIService.getUsageStats(req.user!.id);

      sendResponse({
        res,
        message: "Usage stats retrieved",
        data: usage,
      });
    }
  );
}
