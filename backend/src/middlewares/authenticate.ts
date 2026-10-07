import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

interface TokenPayload {
  sub: string;
  role: Role;
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentification requise"));
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as unknown as TokenPayload;
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    next(new HttpError(401, "Jeton invalide ou expire"));
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Authentification requise"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Acces refuse"));
    next();
  };
