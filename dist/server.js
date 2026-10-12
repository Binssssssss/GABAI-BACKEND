import "dotenv/config";
import app from "./app.js";
import { startTaskDeadlineReminderScheduler } from "./services/task-deadline-scheduler.service.js";
const PORT = Number(process.env.PORT) || 8000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    startTaskDeadlineReminderScheduler();
});
//# sourceMappingURL=server.js.map