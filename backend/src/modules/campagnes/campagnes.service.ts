import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { HttpError } from "../../utils/httpError";
import { CampagneInput, GenerateInput, InvitationQuery } from "./campagnes.schemas";

const lienEnquete = (jeton: string) =>
  `${env.FRONTEND_URL.replace(/\/+$/, "")}/enquete/${jeton}`;

async function findCampagne(id: number) {
  const campagne = await prisma.campagne.findUnique({ where: { id } });
  if (!campagne) throw new HttpError(404, "Campagne introuvable");
  return campagne;
}

export function listCampagnes() {
  return prisma.campagne.findMany({
    orderBy: { dateDebut: "desc" },
    include: { _count: { select: { invitations: true } } },
  });
}

export async function getCampagne(id: number) {
  const campagne = await findCampagne(id);
  const [invitations, reponses] = await Promise.all([
    prisma.invitation.count({ where: { campagneId: id } }),
    prisma.reponse.count({ where: { invitation: { campagneId: id } } }),
  ]);
  const tauxReponse = invitations === 0 ? 0 : Math.round((reponses / invitations) * 1000) / 10;
  return { ...campagne, resume: { invitations, reponses, tauxReponse } };
}

export function createCampagne(data: CampagneInput) {
  return prisma.campagne.create({ data });
}

export async function updateCampagne(id: number, data: CampagneInput) {
  const c = await findCampagne(id);
  if (c.statut !== "BROUILLON") {
    throw new HttpError(409, "Seule une campagne en brouillon peut etre modifiee");
  }
  return prisma.campagne.update({ where: { id }, data });
}

export async function deleteCampagne(id: number) {
  const c = await findCampagne(id);
  if (c.statut !== "BROUILLON") {
    throw new HttpError(409, "Seule une campagne en brouillon peut etre supprimee");
  }
  await prisma.campagne.delete({ where: { id } });
}

export async function ouvrirCampagne(id: number) {
  const c = await findCampagne(id);
  if (c.statut !== "BROUILLON") throw new HttpError(409, "La campagne n'est pas en brouillon");
  const n = await prisma.invitation.count({ where: { campagneId: id } });
  if (n === 0) throw new HttpError(409, "Ajoutez des invitations avant d'ouvrir la campagne");
  return prisma.campagne.update({ where: { id }, data: { statut: "OUVERTE" } });
}

export async function cloturerCampagne(id: number) {
  const c = await findCampagne(id);
  if (c.statut !== "OUVERTE") throw new HttpError(409, "Seule une campagne ouverte peut etre cloturee");
  return prisma.campagne.update({ where: { id }, data: { statut: "CLOTUREE" } });
}

export async function generateInvitations(campagneId: number, f: GenerateInput) {
  const c = await findCampagne(campagneId);
  if (c.statut === "CLOTUREE") throw new HttpError(409, "La campagne est cloturee");

  const where: Prisma.DiplomeWhereInput = {};
  if (f.promotionId !== undefined) where.promotionId = f.promotionId;
  const promotion: Prisma.PromotionWhereInput = {};
  if (f.filiereId !== undefined) promotion.filiereId = f.filiereId;
  if (f.anneeSortie !== undefined) promotion.anneeSortie = f.anneeSortie;
  if (Object.keys(promotion).length > 0) where.promotion = promotion;

  const diplomes = await prisma.diplome.findMany({ where, select: { id: true } });
  if (diplomes.length === 0) throw new HttpError(404, "Aucun diplome ne correspond a ce filtre");

  const res = await prisma.invitation.createMany({
    data: diplomes.map((d) => ({
      campagneId,
      diplomeId: d.id,
      jeton: randomBytes(32).toString("base64url"),
    })),
    skipDuplicates: true,
  });
  return {
    diplomesCibles: diplomes.length,
    invitationsCreees: res.count,
    dejaExistantes: diplomes.length - res.count,
  };
}

export async function listInvitations(campagneId: number, q: InvitationQuery) {
  await findCampagne(campagneId);
  const where: Prisma.InvitationWhereInput = { campagneId };
  if (q.statut === "repondu") where.reponse = { isNot: null };
  if (q.statut === "en_attente") where.reponse = { is: null };

  const [rows, total] = await prisma.$transaction([
    prisma.invitation.findMany({
      where,
      orderBy: { id: "asc" },
      skip: (q.page - 1) * q.limite,
      take: q.limite,
      include: {
        diplome: { select: { nom: true, prenom: true, contact: true } },
        reponse: { select: { id: true } },
      },
    }),
    prisma.invitation.count({ where }),
  ]);

  return {
    data: rows.map((r) => ({
      id: r.id,
      jeton: r.jeton,
      lien: lienEnquete(r.jeton),
      diplome: r.diplome,
      repondu: r.reponse !== null,
    })),
    pagination: { page: q.page, limite: q.limite, total, pages: Math.ceil(total / q.limite) },
  };
}

export async function getInvitationQrCode(campagneId: number, invitationId: number) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, campagneId },
    select: { jeton: true },
  });
  if (!invitation) throw new HttpError(404, "Invitation introuvable");
  return QRCode.toBuffer(lienEnquete(invitation.jeton), {
    type: "png",
    width: 300,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
