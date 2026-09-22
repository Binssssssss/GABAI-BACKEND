import { AppError, sendError } from "@/utils/response";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err, req, res, next) {
    if (err instanceof AppError) {
        return sendError(res, err.message, err.statusCode, err.errors);
    }
    console.error(err);
    return sendError(res, "Something went wrong. Please try again later.", 500);
}
//# sourceMappingURL=error.middleware.js.map