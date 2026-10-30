import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/httpError";

const schema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  motDePasse: z.string().min(8),
  role: z.enum(["CANDIDAT", "RECRUTEUR"]),
  // Infos pour le diplome (si role = CANDIDAT)
  filiereId: z.number().optional(),
  niveauEtudes: z.string().optional(),
  etablissement: z.string().optional(),
  // Infos pour le recruteur
  organisme: z
    .object({
      nom: z.string().min(2),
      type: z.enum(["MINISTERE", "ADMINISTRATION", "ENTREPRISE_PRIVEE", "ONG", "AUTRE"]).default("AUTRE"),
      ville: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

export const inscriptionRoutes = Router();

inscriptionRoutes.post("/", async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    if (data.role === "RECRUTEUR" && !data.organisme) {
      throw new HttpError(400, "Les informations de l organisme sont obligatoires pour un compte recruteur");
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
