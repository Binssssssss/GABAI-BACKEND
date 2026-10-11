import { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "@/utils/jwt";
import { sendError } from "@/utils/response";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.get("authorization");

  console.log("========== AUTH DEBUG ==========");
  console.log("AUTH HEADER EXISTS:", !!header);
  console.log(
    "AUTH HEADER PREFIX:",
    header
      ? header.substring(0, 20) + "..."
      : "NONE",
  );

  if (!header || !header.startsWith("Bearer ")) {
    console.log("AUTH RESULT: NO BEARER TOKEN");

    return sendError(
      res,
      "Authentication required. Please log in.",
      401,
    );
  }

  const token = header.slice(7).trim();

  console.log(
    "TOKEN EXISTS:",
    !!token,
  );

  if (!token) {
    console.log("AUTH RESULT: EMPTY TOKEN");

    return sendError(
      res,
      "Authentication required. Please log in.",
      401,
    );
  }

  try {
    const payload = verifyAccessToken(token);

    console.log(
      "TOKEN VERIFIED: YES",
    );

    console.log(
      "USER ID:",
      payload.id,
    );

    req.user = payload;

    console.log(
      "AUTH RESULT: SUCCESS",
    );

    console.log("==============================");

    return next();
  } catch (error) {
    console.log(
      "TOKEN VERIFIED: NO",
    );

    console.log(
      "JWT ERROR:",
      error,
    );

    console.log("==============================");

    return sendError(
      res,
      "Invalid or expired token. Please log in again.",
      401,
    );
  }
}

export default authMiddleware;