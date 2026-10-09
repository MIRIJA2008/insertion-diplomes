import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Donnees invalides",
      details: err.issues.map((i) => ({ champ: i.path.join("."), message: i.message })),
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "Cette valeur existe deja" });
      return;
    }
    if (err.code === "P2003") {
      res.status(409).json({ error: "Operation impossible : des elements y sont rattaches" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Element introuvable" });
      return;
    }
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "JSON invalide" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
};
