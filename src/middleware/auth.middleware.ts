import { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "@/utils/jwt";
import { sendError } from "@/utils/response";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.get("authorization");

  if (!header || !header.startsWith("Bearer ")) {
    return sendError(
      res,
      "Authentication required. Please log in.",
      401,
    );
  }

  const token = header.slice(7).trim();

  if (!token) {
    return sendError(
      res,
      "Authentication required. Please log in.",
      401,
    );
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = payload;

    return next();
  } catch {
    return sendError(
      res,
      "Invalid or expired token. Please log in again.",
      401,
    );
  }
}

export default authMiddleware;