import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import * as pushTokenController from "@/controllers/push-token.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", pushTokenController.registerPushToken);
router.delete("/", pushTokenController.deletePushToken);

export default router;