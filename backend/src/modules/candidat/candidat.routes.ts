import { Router } from "express";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";

export const candidatRoutes = Router();
candidatRoutes.use(authenticate, requireRole("CANDIDAT"));

candidatRoutes.get("/dashboard", async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Profil et promotion : aucune donnée binaire n'est chargée.
    const profil = await prisma.profilCandidat.findUnique({
      where: { utilisateurId: userId },
      select: {
        niveauEtudes: true,
        filiereId: true,
        etablissement: true,
        competences: true,
        experience: true,
        cvNom: true,
        filiere: {
          select: {
            intitule: true,
            promotions: {
              select: {
                id: true,
                anneeSortie: true,
              },
              orderBy: { anneeSortie: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const aCv = Boolean(profil?.cvNom);
    const promotion = profil?.filiere?.promotions?.[0] || null;

    // Offres recommandées : uniquement les champs utiles au tableau de bord.
    const offresRecommandees = await prisma.offre.findMany({
      where: {
        dateLimite: { gte: new Date() },
        ...(profil?.filiereId ? { filiereId: profil.filiereId } : {}),
      },
      select: {
        id: true,
        titre: true,
        lieu: true,
        typeContrat: true,
        organisme: {
          select: { nom: true },
        },
      },
      take: 5,
      orderBy: { creeLe: "desc" },
    });

    // Candidatures récentes du candidat connecté uniquement.
    const candidatures = await prisma.candidature.findMany({
      where: { candidatId: userId },
      select: {
        id: true,
        statut: true,
        dateEnvoi: true,
        offre: {
          select: {
            titre: true,
            organisme: {
              select: { nom: true },
            },
          },
        },
      },
      orderBy: { dateEnvoi: "desc" },
      take: 5,
    });

    // Actualités de la promotion, avec conservation du fallback existant.
    let actualites: any[] = [];

    const selectActualite = {
      id: true,
      titre: true,
      contenu: true,
      type: true,
      creeLe: true,
    };

    if (promotion?.id) {
      actualites = await prisma.actualitePromotion.findMany({
        where: { promotionId: promotion.id },
        select: selectActualite,
        orderBy: { creeLe: "desc" },
        take: 5,
      });
    } else {
      actualites = await prisma.actualitePromotion.findMany({
        select: selectActualite,
        orderBy: { creeLe: "desc" },
        take: 5,
      });
    }

    const profilSecurise = profil
      ? {
          niveauEtudes: profil.niveauEtudes,
          filiereId: profil.filiereId,
          etablissement: profil.etablissement,
          competences: profil.competences,
          experience: profil.experience,
          filiere: profil.filiere,
          aCv,
        }
      : null;

    res.json({
      profil: profilSecurise,
      offresRecommandees,
      candidatures,
      actualites,
      promotion,
    });
  } catch (e) {
    next(e);
  }
});