import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { HttpError } from "../../utils/httpError";

const BCRYPT_ROUNDS = 12;
// Hash factice : on compare toujours, meme si l'e-mail n'existe pas,
// pour que le temps de reponse ne revele pas quels e-mails sont valides.
const DUMMY_HASH = bcrypt.hashSync("mot-de-passe-factice", BCRYPT_ROUNDS);

export async function login(email: string, motDePasse: string) {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  const ok = await bcrypt.compare(motDePasse, utilisateur?.motDePasseHash ?? DUMMY_HASH);
  if (!utilisateur || !ok) {
    throw new HttpError(401, "Identifiants invalides");
  }
  const token = jwt.sign({ role: utilisateur.role }, env.JWT_SECRET, {
    subject: String(utilisateur.id),
    expiresIn: env.JWT_EXPIRES_IN_SECONDS,
    algorithm: "HS256",
  });
  return {
    token,
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role,
    },
  };
}

export async function getProfile(id: number) {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id },
    select: { id: true, nom: true, email: true, role: true },
  });
  if (!utilisateur) throw new HttpError(404, "Utilisateur introuvable");
  return utilisateur;
}
