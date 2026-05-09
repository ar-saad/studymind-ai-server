import { Router } from "express";
import { TopicController } from "./topic.controller";
import { AIController } from "../ai/ai.controller";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

// Public routes
router.get("/", TopicController.getTopics);
router.get("/popular", TopicController.getPopularTopics);
router.get("/categories", TopicController.getCategories);
router.get("/stats/public", TopicController.getPublicStats);

// Protected: Create a new topic via AI (must be before /:slug)
router.post("/create", authenticate, AIController.createTopic);

router.get("/:slug", TopicController.getTopicBySlug);

// Protected routes
router.post("/:id/review", authenticate, TopicController.submitReview);
router.get("/:id/related", TopicController.getRelatedTopics);

export default router;
