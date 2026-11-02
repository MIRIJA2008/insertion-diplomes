import { Router } from "express";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middlewares/authenticate";

export const candidatRoutes = Router();
candidatRoutes.use(authenticate);

candidatRoutes.get("/dashboard", async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // 1. Profil + Promotion
    const profil = await prisma.profilCandidat.findUnique({
      where: { utilisateurId: userId },
      include: {
        filiere: {
          include: {
            promotions: {
              orderBy: { anneeSortie: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    // 2. Offres recommandées (simplifié : offres ouvertes de la même filière)
    const offresRecommandees = await prisma.offre.findMany({
      where: {
        dateLimite: { gte: new Date() },
        ...(profil?.filiereId ? { filiereId: profil.filiereId } : {}),
      },
      include: { organisme: true, filiere: true },
      take: 5,
      orderBy: { creeLe: "desc" },
    });

    // 3. Mes candidatures récentes
    const candidatures = await prisma.candidature.findMany({
      where: { candidatId: userId },
      include: {
        offre: { include: { organisme: true } },
      },
      orderBy: { dateEnvoi: "desc" },
      take: 5,
    });

    // 4. Actualités de la promotion
    let actualites: any[] = [];
    if (profil?.filiere?.promotions?.[0]?.id) {
      // Actualites de la promotion specifique
      actualites = await prisma.actualitePromotion.findMany({
        where: { promotionId: profil.filiere.promotions[0].id },
        orderBy: { creeLe: "desc" },
        take: 5,
      });
    } else {
      // Fallback : les 5 dernieres actualites de la plateforme
      actualites = await prisma.actualitePromotion.findMany({
        orderBy: { creeLe: "desc" },
        take: 5,
      });
    }

    res.json({
      profil,
      offresRecommandees,
      candidatures,
      actualites,
      promotion: profil?.filiere?.promotions?.[0] || null,
    });
  } catch (e) { next(e); }
});