import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/httpError";
import { PromotionInput, PromotionQuery } from "./promotions.schemas";

async function ensureFiliere(id: number) {
  const filiere = await prisma.filiere.findUnique({ where: { id }, select: { id: true } });
  if (!filiere) throw new HttpError(404, "Filiere introuvable");
}

export function listPromotions(f: PromotionQuery) {
  const where: Prisma.PromotionWhereInput = {};
  if (f.filiereId !== undefined) where.filiereId = f.filiereId;
  if (f.anneeSortie !== undefined) where.anneeSortie = f.anneeSortie;
  return prisma.promotion.findMany({
    where,
    orderBy: [{ anneeSortie: "desc" }, { filiereId: "asc" }],
    include: {
      filiere: { select: { code: true, intitule: true } },
      _count: { select: { diplomes: true } },
    },
  });
}

export async function getPromotion(id: number) {
  const promotion = await prisma.promotion.findUnique({
    where: { id },
    include: { filiere: { select: { code: true, intitule: true } } },
  });
  if (!promotion) throw new HttpError(404, "Promotion introuvable");
  return promotion;
}

export async function createPromotion(data: PromotionInput) {
  await ensureFiliere(data.filiereId);
  return prisma.promotion.create({ data });
}

export async function updatePromotion(id: number, data: PromotionInput) {
  await ensureFiliere(data.filiereId);
  return prisma.promotion.update({ where: { id }, data });
}

export function deletePromotion(id: number) {
  return prisma.promotion.delete({ where: { id } });
}
