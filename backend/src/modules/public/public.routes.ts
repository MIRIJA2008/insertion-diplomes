import { Router } from "express";
import { prisma } from "../../config/prisma";
import { statutOffre } from "../offres/offres.routes";

export const publicRoutes = Router();

publicRoutes.get("/accueil", async (_req, res, next) => {
  try {
    const [diplomes, offres, organismes, filieres, candidats, reponsesEnquete] = await Promise.all([
      prisma.diplome.count(),
      prisma.offre.count({ where: { dateLimite: { gte: new Date() } } }),
      prisma.organisme.count({ where: { verifie: true } }),
      prisma.filiere.count(),
      prisma.utilisateur.count({ where: { role: "CANDIDAT" } }),
      prisma.reponse.count(),
    ]);
    const dernieresOffres = await prisma.offre.findMany({
      where: { dateLimite: { gte: new Date() } },
      include: { organisme: { select: { nom: true, type: true, ville: true } }, filiere: { select: { code: true } } },
      orderBy: { creeLe: "desc" },
      take: 6,
    });
    res.json({
      stats: { diplomes, offres, organismes, filieres, candidats, reponsesEnquete },
      categories: ["MINISTERE", "ADMINISTRATION", "ENTREPRISE_PRIVEE", "ONG", "AUTRE"],
      dernieresOffres: dernieresOffres.map((o) => ({ ...o, statut: statutOffre(o.dateLimite) })),
    });
  } catch (e) {
    next(e);
  }
});