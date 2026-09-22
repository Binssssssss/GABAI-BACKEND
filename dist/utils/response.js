export function sendSuccess(res, message, data, statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
}
export function sendError(res, message, statusCode = 400, errors) {
    return res.status(statusCode).json({ success: false, message, errors });
}
export class AppError extends Error {
    statusCode;
    errors;
    constructor(message, statusCode = 400, errors) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
//# sourceMappingURL=response.js.map