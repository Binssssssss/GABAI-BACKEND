export function errorMiddleware(err, req, res, next) {
    console.error("=================================");
    console.error("❌ BACKEND ERROR");
    console.error("Message:", err?.message);
    console.error("Stack:", err?.stack);
    console.error("=================================");
    return res.status(err?.statusCode || 500).json({
        success: false,
        message: err?.message || "Something went wrong.",
        error: process.env.NODE_ENV === "development"
            ? err?.stack
            : undefined,
    });
}
//# sourceMappingURL=error.middleware.js.map