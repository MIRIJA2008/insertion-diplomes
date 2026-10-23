import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";

export const profilsRoutes = Router();
profilsRoutes.use(authenticate);

const profilSchema = z.object({
  niveauEtudes: z.string().optional(),
  filiereId: z.number().int().nullable().optional(),
  etablissement: z.string().optional(),
  diplomes: z.array(z.string()).optional(),
  competences: z.array(z.string()).optional(),
  experience: z.string().optional(),
});

// Compte + profil complet
profilsRoutes.get("/moi", async (req, res, next) => {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: req.user!.id },
      select: { id: true, nom: true, email: true, role: true, langue: true, couleurAccent: true },
    });
    if (!utilisateur) throw new HttpError(404, "Utilisateur introuvable");
    const profil = await prisma.profilCandidat.findUnique({
      where: { utilisateurId: req.user!.id },
      include: { filiere: true },
    });
    res.json({ utilisateur, profil, cvNom: profil?.cvNom ?? null });
  } catch (e) {
    next(e);
  }
});

// Mise a jour du profil candidat
profilsRoutes.put("/moi", async (req, res, next) => {
  try {
    if (req.user!.role !== "CANDIDAT" && req.user!.role !== "ADMIN") {
      throw new HttpError(403, "Reserve aux candidats");
    }
    const data = profilSchema.parse(req.body);
    await prisma.profilCandidat.upsert({
      where: { utilisateurId: req.user!.id },
      create: { utilisateurId: req.user!.id },
      update: {},
    });
    const maj = await prisma.profilCandidat.update({
      where: { utilisateurId: req.user!.id },
      data: {
        ...(data.niveauEtudes !== undefined ? { niveauEtudes: data.niveauEtudes || null } : {}),
        ...(data.filiereId !== undefined ? { filiereId: data.filiereId } : {}),
        ...(data.etablissement !== undefined ? { etablissement: data.etablissement || null } : {}),
        ...(data.diplomes !== undefined ? { diplomes: data.diplomes } : {}),
        ...(data.competences !== undefined ? { competences: data.competences } : {}),
        ...(data.experience !== undefined ? { experience: data.experience || null } : {}),
      },
      include: { filiere: true },
    });
    res.json(maj);
  } catch (e) {
    next(e);
  }
});

// Preferences : langue + couleur d'accent
profilsRoutes.put("/moi/preferences", async (req, res, next) => {
  try {
    const { langue, couleurAccent } = z
      .object({
        langue: z.enum(["fr", "mg"]).optional(),
        couleurAccent: z.enum(["bleu", "vert", "rouge", "violet", "orange", "rose"]).optional(),
      })
      .parse(req.body);
    const maj = await prisma.utilisateur.update({
      where: { id: req.user!.id },
      data: { ...(langue ? { langue } : {}), ...(couleurAccent ? { couleurAccent } : {}) },
      select: { id: true, langue: true, couleurAccent: true },
    });
    res.json(maj);
  } catch (e) {
    next(e);
  }
});

// Televersement du CV (PDF en base64 dans le JSON)
profilsRoutes.post("/moi/cv", async (req, res, next) => {
  try {
    const { nom, contenu } = z
      .object({ nom: z.string().min(1), contenu: z.string().startsWith("data:application/pdf") })
      .parse(req.body);
    const base64 = contenu.split(",")[1] ?? "";
    await prisma.profilCandidat.upsert({
      where: { utilisateurId: req.user!.id },
      create: { utilisateurId: req.user!.id },
      update: {},
    });
    await prisma.profilCandidat.update({
      where: { utilisateurId: req.user!.id },
      data: { cvPdf: Buffer.from(base64, "base64"), cvNom: nom },
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Consultation du CV
profilsRoutes.get("/moi/cv", async (req, res, next) => {
  try {
    const profil = await prisma.profilCandidat.findUnique({ where: { utilisateurId: req.user!.id } });
    if (!profil?.cvPdf) throw new HttpError(404, "Aucun CV televerse");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${profil.cvNom ?? "cv.pdf"}"`);
    res.send(profil.cvPdf);
  } catch (e) {
    next(e);
  }
});
// Consultation profil candidat par recruteur/admin
profilsRoutes.get("/:candidatId/photo", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.candidatId);
    const p = await prisma.profilCandidat.findUnique({ where: { utilisateurId: id } });
    if (!p || !p.photo) return next(new HttpError(404, "Photo introuvable"));
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(p.photo));
  } catch (e) { next(e); }
});

profilsRoutes.get("/:candidatId/cv", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.candidatId);
    const p = await prisma.profilCandidat.findUnique({ where: { utilisateurId: id } });
    if (!p || !p.cvPdf) return next(new HttpError(404, "CV introuvable"));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${p.cvNom ?? "cv.pdf"}"`);
    res.send(Buffer.from(p.cvPdf));
  } catch (e) { next(e); }
});

profilsRoutes.get("/:candidatId", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.candidatId);
    const u = await prisma.utilisateur.findUnique({
      where: { id },
      include: { profilCandidat: { include: { filiere: true } } },
    });
    if (!u) return next(new HttpError(404, "Utilisateur introuvable"));
    if (!u.profilCandidat) return next(new HttpError(404, "Ce candidat n a pas de profil"));
    const p = u.profilCandidat;
    res.json({
      utilisateur: { id: u.id, nom: u.nom, email: u.email, creeLe: u.creeLe },
      profil: {
        niveauEtudes: p.niveauEtudes,
        filiere: p.filiere,
        etablissement: p.etablissement,
        diplomes: p.diplomes,
        competences: p.competences,
        experience: p.experience,
        aCv: !!p.cvPdf,
        cvNom: p.cvNom,
        aPhoto: !!p.photo,
        majLe: p.majLe,
      },
    });
  } catch (e) { next(e); }
});