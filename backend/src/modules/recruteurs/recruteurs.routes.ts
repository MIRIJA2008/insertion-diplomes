import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";

export const recruteursRoutes = Router();
recruteursRoutes.use(authenticate, requireRole("RECRUTEUR", "ADMIN"));

const organismeSchema = z.object({
  nom: z.string().min(2),
  type: z.enum(["MINISTERE", "ADMINISTRATION", "ENTREPRISE_PRIVEE", "ONG", "AUTRE"]),
  ville: z.string().optional(),
  description: z.string().optional(),
});

recruteursRoutes.get("/moi/organisme", async (req, res, next) => {
  try {
    const organisme = await prisma.organisme.findUnique({
      where: { utilisateurId: req.user!.id },
      include: { _count: { select: { offres: true } } },
    });
    res.json(organisme);
  } catch (e) {
    next(e);
  }
});

recruteursRoutes.put("/moi/organisme", async (req, res, next) => {
  try {
    const data = organismeSchema.parse(req.body);
    const organisme = await prisma.organisme.upsert({
      where: { utilisateurId: req.user!.id },
      create: { utilisateurId: req.user!.id, ...data },
      update: data,
    });
    res.json(organisme);
  } catch (e) {
    next(e);
  }
});