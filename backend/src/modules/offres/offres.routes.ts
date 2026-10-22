import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";

export type StatutOffre = "OUVERTE" | "EXPIRE_BIENTOT" | "CLOTUREE";

export function statutOffre(dateLimite: Date): StatutOffre {
  const maintenant = Date.now();
  const limite = new Date(dateLimite).getTime();
  if (limite < maintenant) return "CLOTUREE";
  if (limite < maintenant + 7 * 24 * 3600 * 1000) return "EXPIRE_BIENTOT";
  return "OUVERTE";
}

const offreInclude = {
  organisme: { select: { id: true, nom: true, type: true, ville: true, verifie: true } },
  filiere: { select: { id: true, code: true, intitule: true } },
  _count: { select: { candidatures: true } },
} as const;

function avecStatut(o: any) {
  const { _count, ...reste } = o;
  return { ...reste, nbCandidatures: _count?.candidatures ?? 0, statut: statutOffre(o.dateLimite) };
}

const offreSchema = z.object({
  titre: z.string().min(3),
  description: z.string().min(10),
  niveauRequis: z.string().optional(),
  filiereId: z.number().int().optional(),
  competencesRecherchees: z.array(z.string()).default([]),
  profilRecherche: z.string().optional(),
  lieu: z.string().min(2),
  typeContrat: z.enum(["CDI", "CDD", "STAGE", "INDEPENDANT", "OCCASIONNEL"]).optional(),
  dateLimite: z.coerce.date(),
});

export const offresRoutes = Router();

// Liste publique avec filtres (les offres cloturees sont masquees par defaut)
offresRoutes.get("/", async (req, res, next) => {
  try {
    const { q, ville, typeContrat, filiereId, organismeId, toutes } = req.query as Record<string, string>;
    const offres = await prisma.offre.findMany({
      where: {
        ...(q
          ? { OR: [{ titre: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }
          : {}),
        ...(ville ? { lieu: { contains: ville, mode: "insensitive" } } : {}),
        ...(typeContrat ? { typeContrat: typeContrat as any } : {}),
        ...(filiereId ? { filiereId: Number(filiereId) } : {}),
        ...(organismeId ? { organismeId: Number(organismeId) } : {}),
      },
      include: offreInclude,
      orderBy: { creeLe: "desc" },
    });
    const resultat = offres.map(avecStatut).filter((o) => toutes === "1" || o.statut !== "CLOTUREE");
    res.json(resultat);
  } catch (e) {
    next(e);
  }
});

// Recommandations selon le profil du candidat connecte
offresRoutes.get("/recommandees", authenticate, async (req, res, next) => {
  try {
    const profil = await prisma.profilCandidat.findUnique({ where: { utilisateurId: req.user!.id } });
    const offres = await prisma.offre.findMany({
      where: { dateLimite: { gte: new Date() } },
      include: offreInclude,
      orderBy: { creeLe: "desc" },
      take: 50,
    });
    const competences = (profil?.competences ?? []).map((c) => c.toLowerCase());
    const filiereId = profil?.filiereId;
    const niveau = profil?.niveauEtudes?.toLowerCase() ?? "";
    const note = (o: any) => {
      let score = 0;
      if (niveau && o.niveauRequis && o.niveauRequis.toLowerCase().includes(niveau)) score += 3;
      if (filiereId && o.filiereId === filiereId) score += 4;
      const recherchees = (o.competencesRecherchees ?? []).map((c: string) => c.toLowerCase());
      score += competences.filter((c) => recherchees.some((r: string) => r.includes(c) || c.includes(r))).length * 2;
      return score;
    };
    const resultat = offres
      .map((o) => ({ ...avecStatut(o), score: note(o) }))
      .filter((o) => o.score > 0)
      .sort((a, b) => b.score - a.score);
    res.json(resultat);
  } catch (e) {
    next(e);
  }
});

// Mes offres (recruteur) - declare AVANT /:id
offresRoutes.get("/recruteur/mes-offres", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const organisme = await prisma.organisme.findUnique({ where: { utilisateurId: req.user!.id } });
    if (!organisme) return res.json([]);
    const offres = await prisma.offre.findMany({
      where: { organismeId: organisme.id },
      include: offreInclude,
      orderBy: { creeLe: "desc" },
    });
    res.json(offres.map(avecStatut));
  } catch (e) {
    next(e);
  }
});

// Detail public
offresRoutes.get("/:id", async (req, res, next) => {
  try {
    const offre = await prisma.offre.findUnique({ where: { id: Number(req.params.id) }, include: offreInclude });
    if (!offre) throw new HttpError(404, "Offre introuvable");
    res.json(avecStatut(offre));
  } catch (e) {
    next(e);
  }
});

// Creation (recruteur)
offresRoutes.post("/", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const data = offreSchema.parse(req.body);
    if (data.dateLimite.getTime() < Date.now()) {
      throw new HttpError(400, "La date limite doit etre dans le futur");
    }
    const organisme = await prisma.organisme.findUnique({ where: { utilisateurId: req.user!.id } });
    if (!organisme) throw new HttpError(400, "Vous devez d'abord renseigner votre organisme");
    const offre = await prisma.offre.create({ data: { ...data, organismeId: organisme.id }, include: offreInclude });
    res.status(201).json(avecStatut(offre));
  } catch (e) {
    next(e);
  }
});

// Modification (recruteur proprietaire ou admin)
offresRoutes.put("/:id", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const data = offreSchema.partial().parse(req.body);
    const offre = await prisma.offre.findUnique({ where: { id: Number(req.params.id) }, include: { organisme: true } });
    if (!offre) throw new HttpError(404, "Offre introuvable");
    if (req.user!.role !== "ADMIN" && offre.organisme.utilisateurId !== req.user!.id) throw new HttpError(403, "Acces refuse");
    const maj = await prisma.offre.update({ where: { id: offre.id }, data, include: offreInclude });
    res.json(avecStatut(maj));
  } catch (e) {
    next(e);
  }
});

// Suppression (recruteur proprietaire ou admin)
offresRoutes.delete("/:id", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const offre = await prisma.offre.findUnique({ where: { id: Number(req.params.id) }, include: { organisme: true } });
    if (!offre) throw new HttpError(404, "Offre introuvable");
    if (req.user!.role !== "ADMIN" && offre.organisme.utilisateurId !== req.user!.id) throw new HttpError(403, "Acces refuse");
    await prisma.offre.delete({ where: { id: offre.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});