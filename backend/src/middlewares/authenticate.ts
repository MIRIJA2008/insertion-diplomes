import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentification requise"));
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.sub !== "string" ||
      !/^[1-9]\d*$/.test(payload.sub) ||
      !Number.isSafeInteger(Number(payload.sub)) ||
      typeof payload.role !== "string" ||
      !Object.values(Role).includes(payload.role as Role)
    ) {
      return next(new HttpError(401, "Jeton invalide ou expire"));
    }

    req.user = {
      id: Number(payload.sub),
      role: payload.role as Role,
    };

    return next();
  } catch {
    return next(new HttpError(401, "Jeton invalide ou expire"));
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, "Authentification requise"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Acces refuse"));
    }

    return next();
  };