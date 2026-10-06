import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
const app = express();
app.use((req, res, next) => {
    cors()(req, res, next);
});
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
//# sourceMappingURL=app.js.map