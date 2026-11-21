import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";

export const alertesRoutes = Router();
alertesRoutes.use(authenticate, requireRole("CANDIDAT"));

const idSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

alertesRoutes.get("/", async (req, res, next) => {
  try {
    const alertes = await prisma.alerteOffre.findMany({
      where: { utilisateurId: req.user!.id },
      include: { filiere: true },
      orderBy: { creeLe: "desc" },
    });
    res.json(alertes);
  } catch (e) { next(e); }
});

alertesRoutes.post("/", async (req, res, next) => {
  try {
    const data = z.object({
      nom: z.string().trim().min(2).max(100),
      filiereId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
      typeContrat: z.enum(["CDI", "CDD", "STAGE", "INDEPENDANT", "OCCASIONNEL"]).optional(),
      ville: z.string().trim().max(100).optional(),
      motsCles: z.string().trim().max(200).optional(),
    }).parse(req.body);

    if (data.filiereId !== undefined) {
      const filiere = await prisma.filiere.findUnique({
        where: { id: data.filiereId },
        select: { id: true },
      });
      if (!filiere) throw new HttpError(400, "Filière introuvable");
    }

    const alerte = await prisma.alerteOffre.create({
      data: {
        utilisateurId: req.user!.id,
        nom: data.nom,
        filiereId: data.filiereId,
        typeContrat: data.typeContrat,
        ville: data.ville,
        motsCles: data.motsCles,
      },
      include: { filiere: true },
    });
    res.status(201).json(alerte);
  } catch (e) { next(e); }
});

alertesRoutes.patch("/:id", async (req, res, next) => {
  try {
    const data = z.object({ active: z.boolean() }).parse(req.body);
    const exists = await prisma.alerteOffre.findFirst({
      where: { id: idSchema.parse(req.params.id), utilisateurId: req.user!.id },
    });
    if (!exists) throw new HttpError(404, "Alerte introuvable");
    const maj = await prisma.alerteOffre.update({
      where: { id: exists.id },
      data: { active: data.active },
      include: { filiere: true },
    });
    res.json(maj);
  } catch (e) { next(e); }
});

alertesRoutes.delete("/:id", async (req, res, next) => {
  try {
    const del = await prisma.alerteOffre.deleteMany({
      where: { id: idSchema.parse(req.params.id), utilisateurId: req.user!.id },
    });
    res.json({ deleted: del.count });
  } catch (e) { next(e); }
});
