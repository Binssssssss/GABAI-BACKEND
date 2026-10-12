import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as pushTokenController from "../controllers/push-token.controller.js";
const router = Router();
router.use(authMiddleware);
router.post("/", pushTokenController.registerPushToken);
router.delete("/", pushTokenController.deletePushToken);
export default router;
//# sourceMappingURL=push-token.routes.js.map