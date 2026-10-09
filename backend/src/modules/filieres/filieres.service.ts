import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/httpError";
import { FiliereInput } from "./filieres.schemas";

export function listFilieres() {
  return prisma.filiere.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { promotions: true } } },
  });
}

export async function getFiliere(id: number) {
  const filiere = await prisma.filiere.findUnique({ where: { id } });
  if (!filiere) throw new HttpError(404, "Filiere introuvable");
  return filiere;
}

export function createFiliere(data: FiliereInput) {
  return prisma.filiere.create({ data });
}

export function updateFiliere(id: number, data: FiliereInput) {
  return prisma.filiere.update({ where: { id }, data });
}

export function deleteFiliere(id: number) {
  return prisma.filiere.delete({ where: { id } });
}
