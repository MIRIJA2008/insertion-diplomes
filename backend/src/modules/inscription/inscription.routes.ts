import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/httpError";

const schema = z.object({
  nom: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).toLowerCase(),
  motDePasse: z.string().min(8).max(128),
  role: z.enum(["CANDIDAT", "RECRUTEUR"]),
  filiereId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  niveauEtudes: z.string().trim().min(2).max(100).optional(),
  etablissement: z.string().trim().min(2).max(150).optional(),
  organisme: z
    .object({
      nom: z.string().trim().min(2).max(150),
      type: z.enum(["MINISTERE", "ADMINISTRATION", "ENTREPRISE_PRIVEE", "ONG", "AUTRE"]).default("AUTRE"),
      ville: z.string().trim().max(100).optional(),
      description: z.string().trim().max(1000).optional(),
    })
    .optional(),
});

export const inscriptionRoutes = Router();
const inscriptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives d inscription, reessayez plus tard" },
});

inscriptionRoutes.post("/", inscriptionLimiter, async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    if (data.role === "RECRUTEUR" && !data.organisme) {
      throw new HttpError(400, "Les informations de l organisme sont obligatoires pour un compte recruteur");
    }
    if (data.role === "CANDIDAT") {
      if (!data.filiereId || !data.niveauEtudes || !data.etablissement) {
        throw new HttpError(400, "Les informations academiques sont obligatoires");
      }

      const filiere = await prisma.filiere.findUnique({
        where: { id: data.filiereId },
        select: { id: true },
      });

      if (!filiere) {
        throw new HttpError(400, "La filiere selectionnee est introuvable");
      }
    }
    const existe = await prisma.utilisateur.findUnique({ where: { email: data.email } });
    if (existe) throw new HttpError(409, "Cet e-mail est deja utilise");
    const motDePasseHash = await bcrypt.hash(data.motDePasse, 12);
    
    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom: data.nom,
        email: data.email,
        motDePasseHash,
        role: data.role,
        ...(data.role === "RECRUTEUR" && data.organisme
          ? { organisme: { create: { ...data.organisme } } }
          : { 
              profilCandidat: { 
                create: { 
                  filiereId: data.filiereId, 
                  niveauEtudes: data.niveauEtudes, 
                  etablissement: data.etablissement 
                } 
              } 
            }),
      },
      select: { id: true, nom: true, email: true, role: true },
    });
    res.status(201).json(utilisateur);
  } catch (e) {
    next(e);
  }
});
