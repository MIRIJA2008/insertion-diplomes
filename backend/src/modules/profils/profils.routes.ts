import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";

export const profilsRoutes = Router();
profilsRoutes.use(authenticate);

const TAILLE_MAX_CV = 10 * 1024 * 1024;

const profilSchema = z.object({
  niveauEtudes: z.string().trim().max(100).optional(),
  filiereId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable().optional(),
  etablissement: z.string().trim().max(150).optional(),
  diplomes: z.array(z.string().trim().min(1).max(150)).max(20).optional(),
  competences: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  experience: z.string().trim().max(5000).optional(),
});

function lireIdCandidat(valeur: string | string[]): number {
  if (Array.isArray(valeur) || !/^[1-9]\d*$/.test(valeur)) {
    throw new HttpError(400, "Identifiant candidat invalide");
  }

  const id = Number(valeur);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new HttpError(400, "Identifiant candidat invalide");
  }
  return id;
}

function nomFichierSecurise(nom: string | null | undefined): string {
  const propre = (nom ?? "cv.pdf")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|;]/g, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 150);

  return propre || "cv.pdf";
}

function envoyerNomFichier(res: any, nom: string, disposition: "inline" | "attachment") {
  const securise = nomFichierSecurise(nom);
  const ascii = securise
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");

  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(securise)}`
  );
}

function typeMimePhoto(photo: Buffer): string {
  if (photo.length >= 8 &&
      photo.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return "image/png";
  }
  if (photo.length >= 3 && photo[0] === 0xff && photo[1] === 0xd8 && photo[2] === 0xff) {
    return "image/jpeg";
  }
  if (photo.length >= 12 &&
      photo.toString("ascii", 0, 4) === "RIFF" &&
      photo.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (photo.length >= 6 &&
      ["GIF87a", "GIF89a"].includes(photo.toString("ascii", 0, 6))) {
    return "image/gif";
  }
  return "application/octet-stream";
}

// Compte + profil complet, sans charger les fichiers binaires
profilsRoutes.get("/moi", async (req, res, next) => {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        langue: true,
        couleurAccent: true,
      },
    });

    if (!utilisateur) throw new HttpError(404, "Utilisateur introuvable");

    const profil = await prisma.profilCandidat.findUnique({
      where: { utilisateurId: req.user!.id },
      select: {
        id: true,
        niveauEtudes: true,
        filiereId: true,
        filiere: {
          select: { id: true, code: true, intitule: true },
        },
        etablissement: true,
        diplomes: true,
        competences: true,
        experience: true,
        situationPro: true,
        verifie: true,
        cvNom: true,
        majLe: true,
      },
    });

    res.json({
      utilisateur,
      profil: profil
        ? { ...profil, aCv: !!profil.cvNom, aPhoto: false }
        : null,
      cvNom: profil?.cvNom ?? null,
    });
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

    if (data.filiereId !== undefined && data.filiereId !== null) {
      const filiere = await prisma.filiere.findUnique({
        where: { id: data.filiereId },
        select: { id: true },
      });
      if (!filiere) throw new HttpError(400, "Filiere introuvable");
    }

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
      select: {
        niveauEtudes: true,
        filiereId: true,
        etablissement: true,
        diplomes: true,
        competences: true,
        experience: true,
        majLe: true,
        filiere: { select: { id: true, code: true, intitule: true } },
      },
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
      data: {
        ...(langue ? { langue } : {}),
        ...(couleurAccent ? { couleurAccent } : {}),
      },
      select: { id: true, langue: true, couleurAccent: true },
    });

    res.json(maj);
  } catch (e) {
    next(e);
  }
});

// Televersement du CV : PDF en data URI base64, maximum 10 Mo
profilsRoutes.post("/moi/cv", async (req, res, next) => {
  try {
    if (req.user!.role !== "CANDIDAT" && req.user!.role !== "ADMIN") {
      throw new HttpError(403, "Reserve aux candidats");
    }

    const { nom, contenu } = z.object({
      nom: z.string().trim().min(1).max(150),
      contenu: z.string().max(14 * 1024 * 1024).regex(
        /^data:application\/pdf;base64,[A-Za-z0-9+/]+={0,2}$/,
        "Le fichier doit etre un PDF valide"
      ),
    }).parse(req.body);

    const base64 = contenu.slice("data:application/pdf;base64,".length);
    const fichier = Buffer.from(base64, "base64");

    if (
      fichier.length === 0 ||
      fichier.length > TAILLE_MAX_CV ||
      fichier.subarray(0, 5).toString("ascii") !== "%PDF-"
    ) {
      throw new HttpError(400, "Fichier PDF invalide ou depassant 10 Mo");
    }

    await prisma.profilCandidat.upsert({
      where: { utilisateurId: req.user!.id },
      create: { utilisateurId: req.user!.id },
      update: {},
    });

    await prisma.profilCandidat.update({
      where: { utilisateurId: req.user!.id },
      data: { cvPdf: fichier, cvNom: nomFichierSecurise(nom) },
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Telechargement du CV personnel
profilsRoutes.get("/moi/cv", async (req, res, next) => {
  try {
    const profil = await prisma.profilCandidat.findUnique({
      where: { utilisateurId: req.user!.id },
      select: { cvPdf: true, cvNom: true },
    });

    if (!profil?.cvPdf) throw new HttpError(404, "Aucun CV televerse");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    envoyerNomFichier(res, profil.cvNom ?? "cv.pdf", "attachment");
    res.send(Buffer.from(profil.cvPdf));
  } catch (e) {
    next(e);
  }
});

// Photo d'un candidat : accessible aux recruteurs et administrateurs
profilsRoutes.get("/:candidatId/photo", requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const id = lireIdCandidat(req.params.candidatId);

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!utilisateur || utilisateur.role !== "CANDIDAT") {
      throw new HttpError(404, "Candidat introuvable");
    }

    const profil = await prisma.profilCandidat.findUnique({
      where: { utilisateurId: id },
      select: { photo: true },
    });

    if (!profil?.photo) throw new HttpError(404, "Photo introuvable");

    const photo = Buffer.from(profil.photo);
    res.setHeader("Content-Type", typeMimePhoto(photo));
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.send(photo);
  } catch (e) {
    next(e);
  }
});

// CV d'un candidat : accessible aux recruteurs et administrateurs
profilsRoutes.get("/:candidatId/cv", requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const id = lireIdCandidat(req.params.candidatId);

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!utilisateur || utilisateur.role !== "CANDIDAT") {
      throw new HttpError(404, "Candidat introuvable");
    }

    const profil = await prisma.profilCandidat.findUnique({
      where: { utilisateurId: id },
      select: { cvPdf: true, cvNom: true },
    });

    if (!profil?.cvPdf) throw new HttpError(404, "CV introuvable");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    envoyerNomFichier(res, profil.cvNom ?? "cv.pdf", "attachment");
    res.send(Buffer.from(profil.cvPdf));
  } catch (e) {
    next(e);
  }
});

// Consultation du profil complet d'un candidat par recruteur/admin
profilsRoutes.get("/:candidatId", requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const id = lireIdCandidat(req.params.candidatId);

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        creeLe: true,
        profilCandidat: {
          select: {
            niveauEtudes: true,
            etablissement: true,
            diplomes: true,
            competences: true,
            experience: true,
            cvNom: true,
            majLe: true,
            filiere: {
              select: { id: true, code: true, intitule: true },
            },
          },
        },
      },
    });

    if (!utilisateur || utilisateur.role !== "CANDIDAT") {
      throw new HttpError(404, "Candidat introuvable");
    }

    if (!utilisateur.profilCandidat) {
      throw new HttpError(404, "Ce candidat n'a pas de profil");
    }

    const p = utilisateur.profilCandidat;

    res.json({
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        creeLe: utilisateur.creeLe,
      },
      profil: {
        niveauEtudes: p.niveauEtudes,
        filiere: p.filiere,
        etablissement: p.etablissement,
        diplomes: p.diplomes,
        competences: p.competences,
        experience: p.experience,
        aCv: !!p.cvNom,
        cvNom: p.cvNom,
        aPhoto: false,
        majLe: p.majLe,
      },
    });
  } catch (e) {
    next(e);
  }
});