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


const invitationSchema = z.object({
  diplomeId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  message: z.string().trim().max(2000).optional(),
});const decouverteQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  filiereId: z.preprocess(
    (v) => v === "" ? undefined : v,
    z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional()
  ),
  niveau: z.string().trim().max(100).optional(),
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
// Recherche de diplômés par les recruteurs
recruteursRoutes.get("/decouvrir", async (req, res, next) => {
  try {
    const { q, filiereId, niveau } = decouverteQuerySchema.parse(req.query);
    const where: any = { role: "CANDIDAT", profilCandidat: { isNot: null } };
    
    if (q) {
      where.OR = [
        { nom: { contains: String(q), mode: "insensitive" } },
        { profilCandidat: { competences: { has: String(q) } } },
      ];
    }
    if (filiereId) {
      where.profilCandidat = { ...where.profilCandidat, filiereId: Number(filiereId) };
    }
    if (niveau) {
      where.profilCandidat = { ...where.profilCandidat, niveauEtudes: { contains: String(niveau), mode: "insensitive" } };
    }

    const diplomes = await prisma.utilisateur.findMany({
      where,
      select: {
        id: true,
        nom: true,
        email: true,
        creeLe: true,
        profilCandidat: {
          select: {
            niveauEtudes: true,
            competences: true,
            verifie: true,
            filiere: { select: { code: true, intitule: true } },
          },
        },
      },
      take: 50,
      orderBy: { creeLe: "desc" },
    });
    res.json(diplomes);
  } catch (e) { next(e); }
});

// Inviter un diplômé à postuler (envoi de notification)
recruteursRoutes.post("/inviter", async (req, res, next) => {
  try {
    const { diplomeId, message } = invitationSchema.parse(req.body);
    const recruteurId = req.user!.id;

    const organisme = await prisma.organisme.findUnique({
      where: { utilisateurId: recruteurId },
      select: { nom: true },
    });

    if (!organisme) {
      return res.status(403).json({
        error: "Vous devez avoir un organisme.",
      });
    }

    const candidat = await prisma.utilisateur.findFirst({
      where: {
        id: diplomeId,
        role: "CANDIDAT",
      },
      select: { id: true },
    });

    if (!candidat) {
      return res.status(404).json({
        error: "Diplômé introuvable.",
      });
    }

    await prisma.notification.create({
      data: {
        utilisateurId: candidat.id,
        titre: "Invitation à postuler",
        contenu:
          message ||
          `L'organisme ${organisme.nom} vous invite à consulter ses offres.`,
      },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});