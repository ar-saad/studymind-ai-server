import { Router } from "express";
import { AIController } from "./ai.controller";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// AI generation routes
router.post("/study-guide", AIController.generateStudyGuide);
router.post("/quiz", AIController.generateQuiz);
router.post("/chat", AIController.chat);

// Quiz result saving
router.post("/quiz-result", AIController.saveQuizResult);

// Study session management
router.post("/study-session", AIController.createStudySession);

// Usage stats
router.get("/usage", AIController.getUsage);

export default router;
