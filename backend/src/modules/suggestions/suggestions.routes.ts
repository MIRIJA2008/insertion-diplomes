import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";

export const suggestionsRoutes = Router();
suggestionsRoutes.use(authenticate);

// Envoyer une suggestion (Diplômé / Recruteur)
suggestionsRoutes.post("/", async (req, res, next) => {
  try {
    const { categorie, contenu } = z.object({
      categorie: z.string().min(2),
      contenu: z.string().min(10).max(2000),
    }).parse(req.body);

    const sugg = await prisma.suggestion.create({
      data: { utilisateurId: req.user!.id, categorie, contenu },
    });
    res.status(201).json(sugg);
  } catch (e) { next(e); }
});

// Lister toutes les suggestions (Admin)
suggestionsRoutes.get("/", requireRole("ADMIN", "CONSULTANT"), async (req, res, next) => {
  try {
    const list = await prisma.suggestion.findMany({
      orderBy: { creeLe: "desc" },
    });
    res.json(list);
  } catch (e) { next(e); }
});

// Modifier le statut (Admin)
suggestionsRoutes.patch("/:id", requireRole("ADMIN", "CONSULTANT"), async (req, res, next) => {
  try {
    const { statut, reponse } = z.object({
      statut: z.enum(["NOUVELLE", "EN_COURS", "RETENUE", "MISE_EN_OEUVRE", "REFUSEE"]),
      reponse: z.string().optional(),
    }).parse(req.body);

    const sugg = await prisma.suggestion.update({
      where: { id: Number(req.params.id) },
      data: { statut, reponse },
    });
    res.json(sugg);
  } catch (e) { next(e); }
});