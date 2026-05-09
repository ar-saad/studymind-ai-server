import { Router } from "express";
import { UserController } from "./user.controller";
import { authenticate } from "../../middleware/authenticate";
import { upload } from "../../middleware/upload";

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get("/dashboard", UserController.getDashboardOverview);
router.get("/study-history", UserController.getStudyHistory);
router.get("/quiz-results", UserController.getQuizResults);
router.get("/progress", UserController.getProgress);
router.put("/profile", UserController.updateProfile);
router.post("/upload", upload.single("image"), UserController.uploadProfilePicture);
router.delete("/account", UserController.deleteAccount);

export default router;
