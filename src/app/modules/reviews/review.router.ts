import { Router } from "express";
import { ReviewController } from "./review.controller";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

// Public routes
router.get("/", ReviewController.getReviews);
router.get("/:id", ReviewController.getReviewById);

// All other review routes require authentication
router.use(authenticate);

router.post("/", ReviewController.createReview);
router.put("/:id", ReviewController.updateReview);
router.delete("/:id", ReviewController.deleteReview);

export default router;
