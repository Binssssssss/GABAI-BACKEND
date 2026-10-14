import express, { Application } from "express";
import cors from "cors";

import routes from "@/routes";

import { errorMiddleware } from "@/middleware/error.middleware";
import { notFoundMiddleware } from "@/middleware/notFound.middleware";

const app: Application = express();

app.use((req, res, next) => {
  cors()(req as any, res as any, next);
});

// Larger limit so a small profile photo (base64) fits in the request.
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api", routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;