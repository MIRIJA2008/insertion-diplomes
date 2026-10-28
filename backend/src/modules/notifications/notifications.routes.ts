import { Router } from "express";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middlewares/authenticate";

export const notificationsRoutes = Router();
notificationsRoutes.use(authenticate);

// Liste avec filtres + pagination
notificationsRoutes.get("/", async (req, res, next) => {
  try {
    const { nonLues, limit, offset } = req.query;
    const where: any = { utilisateurId: req.user!.id };
    if (nonLues === "true") where.lue = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { creeLe: "desc" },
        take: limit ? Number(limit) : 50,
        skip: offset ? Number(offset) : 0,
      }),
      prisma.notification.count({ where }),
    ]);
    res.json({ notifications, total });
  } catch (e) { next(e); }
});

// Compteur de non-lues (leger, pour le badge header)
notificationsRoutes.get("/count", async (req, res, next) => {
  try {
    const nonLues = await prisma.notification.count({
      where: { utilisateurId: req.user!.id, lue: false },
    });
    res.json({ nonLues });
  } catch (e) { next(e); }
});

// Marquer toutes comme lues
notificationsRoutes.patch("/tout-lire", async (req, res, next) => {
  try {
    const maj = await prisma.notification.updateMany({
      where: { utilisateurId: req.user!.id, lue: false },
      data: { lue: true },
    });
    res.json({ maj: maj.count });
  } catch (e) { next(e); }
});

// Marquer une comme lue
notificationsRoutes.patch("/:id/lue", async (req, res, next) => {
  try {
    const maj = await prisma.notification.updateMany({
      where: { id: Number(req.params.id), utilisateurId: req.user!.id },
      data: { lue: true },
    });
    res.json({ maj: maj.count });
  } catch (e) { next(e); }
});

// Supprimer une notification
notificationsRoutes.delete("/:id", async (req, res, next) => {
  try {
    const del = await prisma.notification.deleteMany({
      where: { id: Number(req.params.id), utilisateurId: req.user!.id },
    });
    res.json({ deleted: del.count });
  } catch (e) { next(e); }
});