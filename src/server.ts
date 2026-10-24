
import "dotenv/config";
import app from "@/app";
import { startTaskDeadlineReminderScheduler } from "@/services/task-deadline-scheduler.service";

const PORT = Number(process.env.PORT) || 8000;

// Never let one failed request (e.g. an AI call) stop the whole server.
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught exception:", error);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);

  startTaskDeadlineReminderScheduler();
});
