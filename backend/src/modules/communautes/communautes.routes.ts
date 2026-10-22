import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";

export const communautesRoutes = Router();

communautesRoutes.get("/", authenticate, async (_req, res, next) => {
  try {
    const liste = await prisma.communaute.findMany({
      include: { filiere: { select: { code: true } }, _count: { select: { membres: true } } },
      orderBy: { creeLe: "desc" },
    });
    res.json(liste);
  } catch (e) {
    next(e);
  }
});

communautesRoutes.post("/", authenticate, async (req, res, next) => {
  try {
    const data = z
      .object({
        nom: z.string().min(3),
        description: z.string().optional(),
        domaine: z.string().optional(),
        filiereId: z.number().int().optional(),
      })
      .parse(req.body);
    const communaute = await prisma.communaute.create({
      data: { ...data, creeParId: req.user!.id, membres: { create: { utilisateurId: req.user!.id } } },
    });
    res.status(201).json(communaute);
  } catch (e) {
    next(e);
  }
});

communautesRoutes.post("/:id/rejoindre", authenticate, async (req, res, next) => {
  try {
    await prisma.communauteMembre.upsert({
      where: { communauteId_utilisateurId: { communauteId: Number(req.params.id), utilisateurId: req.user!.id } },
      create: { communauteId: Number(req.params.id), utilisateurId: req.user!.id },
      update: {},
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

communautesRoutes.delete("/:id/quitter", authenticate, async (req, res, next) => {
  try {
    await prisma.communauteMembre.deleteMany({
      where: { communauteId: Number(req.params.id), utilisateurId: req.user!.id },
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

communautesRoutes.get("/:id", authenticate, async (req, res, next) => {
  try {
    const communaute = await prisma.communaute.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        filiere: true,
        membres: { include: { utilisateur: { select: { id: true, nom: true } } }, take: 50 },
        messages: {
          include: { auteur: { select: { id: true, nom: true } } },
          orderBy: { envoyeLe: "asc" },
          take: 100,
        },
        _count: { select: { membres: true } },
      },
    });
    if (!communaute) throw new HttpError(404, "Communaute introuvable");
    res.json(communaute);
  } catch (e) {
    next(e);
  }
});

communautesRoutes.post("/:id/messages", authenticate, async (req, res, next) => {
  try {
    const membre = await prisma.communauteMembre.findUnique({
      where: { communauteId_utilisateurId: { communauteId: Number(req.params.id), utilisateurId: req.user!.id } },
    });
    if (!membre) throw new HttpError(403, "Rejoignez d'abord cette communaute");
    const { contenu } = z.object({ contenu: z.string().min(1).max(2000) }).parse(req.body);
    const message = await prisma.messageCommunaute.create({
      data: { communauteId: Number(req.params.id), auteurId: req.user!.id, contenu },
      include: { auteur: { select: { id: true, nom: true } } },
    });
    res.status(201).json(message);
  } catch (e) {
    next(e);
  }
});