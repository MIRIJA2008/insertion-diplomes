import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/httpError";
import { ReponseData, SECTEURS } from "./enquete.schemas";

type Etat = "OUVERTE" | "NON_OUVERTE" | "CLOTUREE";

function etatCampagne(
  c: { statut: string; dateDebut: Date; dateFin: Date },
  maintenant: Date,
): Etat {
  if (c.statut === "CLOTUREE") return "CLOTUREE";
  if (c.statut !== "OUVERTE") return "NON_OUVERTE";
  if (maintenant < c.dateDebut) return "NON_OUVERTE";
  if (maintenant > c.dateFin) return "CLOTUREE";
  return "OUVERTE";
}

async function findInvitation(jeton: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { jeton },
    include: {
      campagne: { select: { titre: true, statut: true, dateDebut: true, dateFin: true } },
      reponse: { select: { id: true } },
    },
  });
  if (!invitation) throw new HttpError(404, "Lien invalide");
  return invitation;
}

export async function getEnquete(jeton: string) {
  const invitation = await findInvitation(jeton);
  const etat = invitation.reponse
    ? "DEJA_REPONDU"
    : etatCampagne(invitation.campagne, new Date());
  return {
    titre: invitation.campagne.titre,
    etat,
    dateFin: invitation.campagne.dateFin,
    secteurs: SECTEURS,
  };
}

export async function submitReponse(jeton: string, data: ReponseData) {
  const invitation = await findInvitation(jeton);
  if (invitation.reponse) throw new HttpError(409, "Vous avez deja repondu");
  if (etatCampagne(invitation.campagne, new Date()) !== "OUVERTE") {
    throw new HttpError(409, "L'enquete n'est pas ouverte");
  }
  try {
    await prisma.reponse.create({ data: { invitationId: invitation.id, ...data } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "Vous avez deja repondu");
    }
    throw e;
  }
}
