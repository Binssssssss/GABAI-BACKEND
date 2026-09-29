import express, { Application } from "express";
import cors from "cors";

import routes from "@/routes";

import { errorMiddleware } from "@/middleware/error.middleware";
import { notFoundMiddleware } from "@/middleware/notFound.middleware";

const app: Application = express();

app.use(cors());

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api", routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;