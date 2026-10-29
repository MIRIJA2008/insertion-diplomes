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
// Pipeline recruteur : candidatures groupees par statut + filtres
candidaturesRoutes.get("/recruteur/pipeline", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const { offreId } = req.query;
    const organisme = await prisma.organisme.findUnique({ where: { utilisateurId: req.user!.id } });
    if (!organisme) {
      return res.json({ ENVOYEE: [], VUE: [], ACCEPTEE: [], REFUSEE: [], stats: { total: 0, parStatut: {} } });
    }

    const where: any = { offre: { organismeId: organisme.id } };
    if (offreId) where.offreId = Number(offreId);

    const candidatures = await prisma.candidature.findMany({
      where,
      include: {
        offre: { select: { id: true, titre: true, lieu: true, typeContrat: true } },
        candidat: {
          select: {
            id: true, nom: true, email: true,
            profilCandidat: { select: { filiereId: true, niveauEtudes: true, competences: true } },
          },
        },
      },
      orderBy: { dateEnvoi: "desc" },
    });

    // Grouper par statut
    const grouped = { ENVOYEE: [], VUE: [], ACCEPTEE: [], REFUSEE: [] } as any;
    for (const c of candidatures) {
      if (grouped[c.statut]) grouped[c.statut].push(c);
    }

    // Stats
    const stats = {
      total: candidatures.length,
      parStatut: {
        ENVOYEE: grouped.ENVOYEE.length,
        VUE: grouped.VUE.length,
        ACCEPTEE: grouped.ACCEPTEE.length,
        REFUSEE: grouped.REFUSEE.length,
      },
    };

    res.json({ ...grouped, stats });
  } catch (e) { next(e); }
});
// ============================================================
// DETAIL ET HISTORIQUE (Chantier 1)
// ============================================================
candidaturesRoutes.get("/candidatures/:id", authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const cand = await prisma.candidature.findUnique({
      where: { id },
      include: {
        offre: { include: { organisme: true, filiere: true } },
        candidat: {
          select: {
            id: true, nom: true, email: true,
            profilCandidat: { include: { filiere: true } },
          },
        },
        historique: {
          orderBy: { creeLe: "desc" },
          include: { auteur: { select: { id: true, nom: true } } },
        },
      },
    });
    if (!cand) return next(new HttpError(404, "Candidature introuvable"));

    const isOwner = cand.candidatId === req.user!.id;
    const isRecruiter = cand.offre.organisme.utilisateurId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isRecruiter && !isAdmin) {
      return next(new HttpError(403, "Acces refuse"));
    }
    res.json(cand);
  } catch (e) { next(e); }
});

candidaturesRoutes.get("/candidatures/:id/historique", authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const cand = await prisma.candidature.findUnique({
      where: { id },
      include: { offre: { include: { organisme: true } } },
    });
    if (!cand) return next(new HttpError(404, "Candidature introuvable"));

    const isOwner = cand.candidatId === req.user!.id;
    const isRecruiter = cand.offre.organisme.utilisateurId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isRecruiter && !isAdmin) {
      return next(new HttpError(403, "Acces refuse"));
    }

    const historique = await prisma.candidatureHistorique.findMany({
      where: { candidatureId: id },
      orderBy: { creeLe: "desc" },
      include: { auteur: { select: { id: true, nom: true } } },
    });
    res.json(historique);
  } catch (e) { next(e); }
});

candidaturesRoutes.delete("/mes-candidatures/:id", authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const cand = await prisma.candidature.findUnique({ where: { id } });
    if (!cand) return next(new HttpError(404, "Candidature introuvable"));
    if (cand.candidatId !== req.user!.id) {
      return next(new HttpError(403, "Vous ne pouvez retirer que vos propres candidatures"));
    }
    await prisma.candidature.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
