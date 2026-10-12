import { Prisma, Situation } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { StatsQuery } from "./statistiques.schemas";

// RG-10 : en dessous de ce nombre de repondants, les resultats sont signales peu fiables.
export const SEUIL_FIABILITE = 5;

const EMPLOIS: Situation[] = ["EMPLOI_SALARIE", "EMPLOI_INDEPENDANT"];

const arrondi = (n: number) => Math.round(n * 10) / 10;
const pct = (part: number, total: number) => (total === 0 ? null : arrondi((part / total) * 100));

function filtreInvitation(q: StatsQuery): Prisma.InvitationWhereInput {
  const promotion: Prisma.PromotionWhereInput = {};
  if (q.filiereId !== undefined) promotion.filiereId = q.filiereId;
  if (q.anneeSortie !== undefined) promotion.anneeSortie = q.anneeSortie;
  const where: Prisma.InvitationWhereInput = {};
  if (q.campagneId !== undefined) where.campagneId = q.campagneId;
  if (Object.keys(promotion).length > 0) where.diplome = { promotion };
  return where;
}

function trier<T extends { effectif: number }>(lignes: T[], libelle: (l: T) => string): T[] {
  return lignes.sort((a, b) => b.effectif - a.effectif || (libelle(a) < libelle(b) ? -1 : 1));
}

export async function calculerStatistiques(q: StatsQuery) {
  const invWhere = filtreInvitation(q);
  const where: Prisma.ReponseWhereInput = { invitation: invWhere };
  const whereEmploi: Prisma.ReponseWhereInput = { ...where, situation: { in: EMPLOIS } };

  const [invitations, parSituation, parSecteur, parContrat, moyennes] = await Promise.all([
    prisma.invitation.count({ where: invWhere }),
    prisma.reponse.groupBy({ by: ["situation"], where, _count: { _all: true } }),
    prisma.reponse.groupBy({
      by: ["secteur"],
      where: { ...whereEmploi, secteur: { not: null } },
      _count: { _all: true },
    }),
    prisma.reponse.groupBy({
      by: ["typeContrat"],
      where: { ...whereEmploi, typeContrat: { not: null } },
      _count: { _all: true },
    }),
    prisma.reponse.aggregate({
      where: whereEmploi,
      _avg: { delaiInsertionMois: true, adequationFormation: true },
    }),
  ]);

  const effectifSituation = (s: Situation) =>
    parSituation.find((x) => x.situation === s)?._count._all ?? 0;
  const reponses = parSituation.reduce((n, x) => n + x._count._all, 0);
  const enEmploi = EMPLOIS.reduce((n, s) => n + effectifSituation(s), 0);

  const moyenne = (v: number | null) => (v === null ? null : arrondi(v));

  return {
    filtres: {
      campagneId: q.campagneId ?? null,
      filiereId: q.filiereId ?? null,
      anneeSortie: q.anneeSortie ?? null,
    },
    invitations,
    reponses,
    tauxReponse: pct(reponses, invitations),
    fiable: reponses >= SEUIL_FIABILITE,
    seuilFiabilite: SEUIL_FIABILITE,
    enEmploi,
    tauxInsertion: pct(enEmploi, reponses),
    tauxPoursuiteEtudes: pct(effectifSituation("POURSUITE_ETUDES"), reponses),
    tauxRechercheEmploi: pct(effectifSituation("RECHERCHE_EMPLOI"), reponses),
    delaiMoyenMois: moyenne(moyennes._avg.delaiInsertionMois),
    adequationMoyenne: moyenne(moyennes._avg.adequationFormation),
    situations: (Object.values(Situation) as Situation[]).map((s) => ({
      situation: s,
      effectif: effectifSituation(s),
      pourcentage: pct(effectifSituation(s), reponses),
    })),
    secteurs: trier(
      parSecteur.map((r) => ({
        secteur: r.secteur ?? "Non precise",
        effectif: r._count._all,
        pourcentage: pct(r._count._all, enEmploi),
      })),
      (l) => l.secteur,
    ),
    contrats: trier(
      parContrat.map((r) => ({
        typeContrat: r.typeContrat ?? "Non precise",
        effectif: r._count._all,
        pourcentage: pct(r._count._all, enEmploi),
      })),
      (l) => l.typeContrat,
    ),
  };
}

export async function statistiquesParFiliere(q: StatsQuery) {
  const filieres = await prisma.filiere.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, intitule: true },
  });
  return Promise.all(
    filieres.map(async (f) => {
      const s = await calculerStatistiques({ ...q, filiereId: f.id });
      return {
        filiere: f,
        invitations: s.invitations,
        reponses: s.reponses,
        tauxReponse: s.tauxReponse,
        tauxInsertion: s.tauxInsertion,
        delaiMoyenMois: s.delaiMoyenMois,
        adequationMoyenne: s.adequationMoyenne,
        fiable: s.fiable,
      };
    }),
  );
}
