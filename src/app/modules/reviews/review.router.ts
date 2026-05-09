import { Router } from "express";
import { ReviewController } from "./review.controller";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

// All review routes require authentication
router.use(authenticate);

router.post("/", ReviewController.createReview);
router.get("/", ReviewController.getReviews);
router.get("/:id", ReviewController.getReviewById);
router.put("/:id", ReviewController.updateReview);
router.delete("/:id", ReviewController.deleteReview);

export default router;
