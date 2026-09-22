import { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error("=================================");
  console.error("❌ BACKEND ERROR");
  console.error("Message:", err?.message);
  console.error("Stack:", err?.stack);
  console.error("=================================");

  return res.status(err?.statusCode || 500).json({
    success: false,
    message: err?.message || "Something went wrong.",
    error:
      process.env.NODE_ENV === "development"
        ? err?.stack
        : undefined,
  });
}