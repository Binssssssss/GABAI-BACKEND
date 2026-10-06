import { verifyAccessToken } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";
export function authMiddleware(req, res, next) {
    const header = req.get("authorization");
    if (!header || !header.startsWith("Bearer ")) {
        return sendError(res, "Authentication required. Please log in.", 401);
    }
    const token = header.slice(7).trim();
    if (!token) {
        return sendError(res, "Authentication required. Please log in.", 401);
    }
    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        return next();
    }
    catch {
        return sendError(res, "Invalid or expired token. Please log in again.", 401);
    }
}
export default authMiddleware;
//# sourceMappingURL=auth.middleware.js.map