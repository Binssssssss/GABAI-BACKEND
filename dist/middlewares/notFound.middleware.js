import { sendError } from "@/utils/response";
export function notFoundMiddleware(req, res) {
    return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}
//# sourceMappingURL=notFound.middleware.js.map