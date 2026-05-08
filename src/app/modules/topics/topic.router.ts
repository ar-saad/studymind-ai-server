import { Router } from "express";
import { TopicController } from "./topic.controller";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

// Public routes
router.get("/", TopicController.getTopics);
router.get("/popular", TopicController.getPopularTopics);
router.get("/categories", TopicController.getCategories);
router.get("/:slug", TopicController.getTopicBySlug);

// Protected routes
router.post("/:id/review", authenticate, TopicController.submitReview);

export default router;
