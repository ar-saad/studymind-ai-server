import { Router } from "express";
import { AdminController } from "./admin.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize("ADMIN"));

router.get("/stats", AdminController.getStats);
router.get("/users", AdminController.getUsers);
router.put("/users/:id/plan", AdminController.updateUserPlan);
router.delete("/users/:id", AdminController.deleteUser);
router.get("/generation-logs", AdminController.getGenerationLogs);
router.get("/topic-analytics", AdminController.getTopicAnalytics);

export default router;
