import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";
import { statutOffre } from "../offres/offres.routes";

export const candidaturesRoutes = Router();

// Postuler (candidat) - refuse si l'offre est cloturee
candidaturesRoutes.post("/offres/:id/postuler", authenticate, requireRole("CANDIDAT", "ADMIN"), async (req, res, next) => {
  try {
    const { lettre } = z.object({ lettre: z.string().max(2000).optional() }).parse(req.body ?? {});
    const offre = await prisma.offre.findUnique({ where: { id: Number(req.params.id) } });
    if (!offre) throw new HttpError(404, "Offre introuvable");
    if (statutOffre(offre.dateLimite) === "CLOTUREE") {
      throw new HttpError(400, "Cette offre est cloturee : la candidature est impossible");
    }
    const deja = await prisma.candidature.findUnique({
      where: { offreId_candidatId: { offreId: offre.id, candidatId: req.user!.id } },
    });
    if (deja) throw new HttpError(409, "Vous avez deja postule a cette offre");
    const candidature = await prisma.candidature.create({
      data: { offreId: offre.id, candidatId: req.user!.id, lettre },
    });
    await prisma.candidatureHistorique.create({
      data: {
        candidatureId: candidature.id,
        ancienStatut: null,
        nouveauStatut: "ENVOYEE",
        commentaire: "Candidature envoyee",
        auteurId: req.user!.id,
      },
    });
    const org = await prisma.organisme.findUnique({ where: { id: offre.organismeId } });
    if (org) {
      await prisma.notification.create({
        data: {
          utilisateurId: org.utilisateurId,
          titre: "Nouvelle candidature",
          contenu: `Nouvelle candidature pour l'offre "${offre.titre}".`,
        },
      });
    }
    res.status(201).json(candidature);
  } catch (e) {
    next(e);
  }
});

// Mes candidatures (candidat)
candidaturesRoutes.get("/mes-candidatures", authenticate, async (req, res, next) => {
  try {
    const liste = await prisma.candidature.findMany({
      where: { candidatId: req.user!.id },
      include: { offre: { include: { organisme: { select: { nom: true, type: true } } } } },
      orderBy: { dateEnvoi: "desc" },
    });
    res.json(liste);
  } catch (e) {
    next(e);
  }
});

// Candidatures recues (recruteur)
candidaturesRoutes.get("/recruteur/candidatures", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const organisme = await prisma.organisme.findUnique({ where: { utilisateurId: req.user!.id } });
    if (!organisme) return res.json([]);
    const liste = await prisma.candidature.findMany({
      where: { offre: { organismeId: organisme.id } },
      include: {
        offre: { select: { id: true, titre: true, dateLimite: true } },
        candidat: { select: { id: true, nom: true, email: true, profilCandidat: { include: { filiere: true } } } },
      },
      orderBy: { dateEnvoi: "desc" },
    });
    res.json(liste);
  } catch (e) {
    next(e);
  }
});

// Changer le statut d'une candidature (recruteur)
candidaturesRoutes.patch("/candidatures/:id/statut", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const { statut, commentaire } = z.object({ statut: z.enum(["ENVOYEE", "VUE", "ACCEPTEE", "REFUSEE"]), commentaire: z.string().max(500).optional() }).parse(req.body);
    const c = await prisma.candidature.findUnique({
      where: { id: Number(req.params.id) },
      include: { offre: { include: { organisme: true } } },
    });
    if (!c) throw new HttpError(404, "Candidature introuvable");
    if (req.user!.role !== "ADMIN" && c.offre.organisme.utilisateurId !== req.user!.id) throw new HttpError(403, "Acces refuse");
    const maj = await prisma.candidature.update({ where: { id: c.id }, data: { statut } });
    await prisma.candidatureHistorique.create({
      data: {
        candidatureId: c.id,
        ancienStatut: c.statut,
        nouveauStatut: statut,
        commentaire: commentaire ?? null,
        auteurId: req.user!.id,
      },
    });
    await prisma.notification.create({
      data: {
        utilisateurId: c.candidatId,
        titre: "Candidature " + statut.toLowerCase(),
        contenu: `Votre candidature a l'offre "${c.offre.titre}" est passee au statut : ${statut}.`,
      },
    });
    res.json(maj);
  } catch (e) {
    next(e);
  }
});

// Ajouter / retirer un favori
candidaturesRoutes.put("/offres/:id/favori", authenticate, async (req, res, next) => {
  try {
    const offreId = Number(req.params.id);
    const existant = await prisma.favori.findUnique({
      where: { offreId_utilisateurId: { offreId, utilisateurId: req.user!.id } },
    });
    if (existant) {
      await prisma.favori.delete({ where: { id: existant.id } });
      return res.json({ favori: false });
    }
    await prisma.favori.create({ data: { offreId, utilisateurId: req.user!.id } });
    res.json({ favori: true });
  } catch (e) {
    next(e);
  }
});

// Mes favoris
candidaturesRoutes.get("/mes-favoris", authenticate, async (req, res, next) => {
  try {
    const liste = await prisma.favori.findMany({
      where: { utilisateurId: req.user!.id },
      include: { offre: { include: { organisme: { select: { nom: true } } } } },
    });
    res.json(liste);
  } catch (e) {
    next(e);
  }
});