import { verifyAccessToken } from "@/utils/jwt";
import { sendError } from "@/utils/response";
// Protects routes: requires "Authorization: Bearer <token>" header.
export function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return sendError(res, "Authentication required. Please log in.", 401);
    }
    try {
        const payload = verifyAccessToken(header.slice(7));
        req.user = payload;
        next();
    }
    catch {
        return sendError(res, "Invalid or expired token. Please log in again.", 401);
    }
}
//# sourceMappingURL=auth.middleware.js.map