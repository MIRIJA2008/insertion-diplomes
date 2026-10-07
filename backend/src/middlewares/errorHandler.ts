import { ErrorRequestHandler } from "express";
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
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "JSON invalide" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
};
