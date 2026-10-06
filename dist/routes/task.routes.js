import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { taskController } from "../controllers/task.controller.js";
const router = Router();
const bulkTaskSchema = z.object({
    taskIds: z
        .array(z.string().uuid("Invalid task ID"))
        .min(1, "At least one task must be selected."),
});
// ===============================
// GET ALL TASKS
// ===============================
router.get("/", authMiddleware, taskController.getAllTasks.bind(taskController));
// ===============================
// GET TASK ANALYTICS
// IMPORTANT: BEFORE /:id
// ===============================
router.get("/analytics", authMiddleware, taskController.getAnalytics.bind(taskController));
// ===============================
// GET TASKS BY FILTER
// IMPORTANT: BEFORE /:id
// ===============================
router.get("/filter", authMiddleware, taskController.getTasksByFilter.bind(taskController));
// ===============================
// GET UPCOMING DEADLINES
// IMPORTANT: BEFORE /:id
// ===============================
router.get("/upcoming", authMiddleware, taskController.getUpcomingDeadlines.bind(taskController));
// ===============================
// GET TASKS BY DATE
// IMPORTANT: BEFORE /:id
// ===============================
router.get("/date/:date", authMiddleware, taskController.getTasksByDate.bind(taskController));
// ===============================
// CREATE TASK
// ===============================
router.post("/", authMiddleware, taskController.createTask.bind(taskController));
// ===============================
// CREATE TASK FROM NOTE
// ===============================
router.post("/from-note", authMiddleware, taskController.convertNoteToTask.bind(taskController));
// ===============================
// BULK COMPLETE
// ===============================
router.post("/bulk/complete", authMiddleware, validate(bulkTaskSchema), taskController.bulkCompleteTasks.bind(taskController));
// ===============================
// BULK DELETE
// ===============================
router.delete("/bulk", authMiddleware, validate(bulkTaskSchema), taskController.bulkDeleteTasks.bind(taskController));
// ===============================
// UPDATE SUBTASK
// ===============================
router.patch("/:id/subtasks/:subTaskId", authMiddleware, taskController.updateSubTask.bind(taskController));
// ===============================
// RESCHEDULE TASK
// ===============================
router.patch("/:id/reschedule", authMiddleware, taskController.rescheduleTask.bind(taskController));
// ===============================
// GET TASK BY ID
// IMPORTANT: KEEP THIS LAST
// ===============================
router.get("/:id", authMiddleware, taskController.getTaskById.bind(taskController));
// ===============================
// UPDATE TASK
// ===============================
router.put("/:id", authMiddleware, taskController.updateTask.bind(taskController));
// ===============================
// DELETE TASK
// ===============================
router.delete("/:id", authMiddleware, taskController.deleteTask.bind(taskController));
export default router;
//# sourceMappingURL=task.routes.js.map