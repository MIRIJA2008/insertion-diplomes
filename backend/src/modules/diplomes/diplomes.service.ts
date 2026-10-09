import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/httpError";
import { DiplomeInput, DiplomeQuery } from "./diplomes.schemas";

const withPromotion = {
  promotion: {
    select: {
      anneeSortie: true,
      filiere: { select: { code: true, intitule: true } },
    },
  },
} satisfies Prisma.DiplomeInclude;

async function ensurePromotion(id: number) {
  const promotion = await prisma.promotion.findUnique({ where: { id }, select: { id: true } });
  if (!promotion) throw new HttpError(404, "Promotion introuvable");
}

export async function listDiplomes(f: DiplomeQuery) {
  const where: Prisma.DiplomeWhereInput = {};
  if (f.q) {
    where.OR = [
      { nom: { contains: f.q, mode: "insensitive" } },
      { prenom: { contains: f.q, mode: "insensitive" } },
    ];
  }
  if (f.promotionId !== undefined) where.promotionId = f.promotionId;

  const promotion: Prisma.PromotionWhereInput = {};
  if (f.filiereId !== undefined) promotion.filiereId = f.filiereId;
  if (f.anneeSortie !== undefined) promotion.anneeSortie = f.anneeSortie;
  if (Object.keys(promotion).length > 0) where.promotion = promotion;

  const [data, total] = await prisma.$transaction([
    prisma.diplome.findMany({
      where,
      orderBy: [{ nom: "asc" }, { prenom: "asc" }, { id: "asc" }],
      skip: (f.page - 1) * f.limite,
      take: f.limite,
      include: withPromotion,
    }),
    prisma.diplome.count({ where }),
  ]);

  return {
    data,
    pagination: { page: f.page, limite: f.limite, total, pages: Math.ceil(total / f.limite) },
  };
}

export async function getDiplome(id: number) {
  const diplome = await prisma.diplome.findUnique({ where: { id }, include: withPromotion });
  if (!diplome) throw new HttpError(404, "Diplome introuvable");
  return diplome;
}

export async function createDiplome(data: DiplomeInput) {
  await ensurePromotion(data.promotionId);
  return prisma.diplome.create({ data });
}

export async function updateDiplome(id: number, data: DiplomeInput) {
  await ensurePromotion(data.promotionId);
  return prisma.diplome.update({ where: { id }, data });
}

export function deleteDiplome(id: number) {
  return prisma.diplome.delete({ where: { id } });
}
