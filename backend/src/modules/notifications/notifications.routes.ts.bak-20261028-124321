import { Router } from "express";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middlewares/authenticate";

export const notificationsRoutes = Router();
notificationsRoutes.use(authenticate);

notificationsRoutes.get("/", async (req, res, next) => {
  try {
    const liste = await prisma.notification.findMany({
      where: { utilisateurId: req.user!.id },
      orderBy: { creeLe: "desc" },
      take: 30,
    });
    res.json(liste);
  } catch (e) {
    next(e);
  }
});

notificationsRoutes.patch("/tout-lire", async (req, res, next) => {
  try {
    const maj = await prisma.notification.updateMany({
      where: { utilisateurId: req.user!.id, lue: false },
      data: { lue: true },
    });
    res.json({ maj: maj.count });
  } catch (e) {
    next(e);
  }
});

notificationsRoutes.patch("/:id/lue", async (req, res, next) => {
  try {
    const maj = await prisma.notification.updateMany({
      where: { id: Number(req.params.id), utilisateurId: req.user!.id },
      data: { lue: true },
    });
    res.json({ maj: maj.count });
  } catch (e) {
    next(e);
  }
});