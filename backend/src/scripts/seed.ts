import "dotenv/config";
import { randomBytes } from "node:crypto";
import type { Prisma, Situation, TypeContrat } from "@prisma/client";
import { prisma } from "../config/prisma";
import { SECTEURS } from "../modules/enquete/enquete.schemas";

const url = process.env.DATABASE_URL ?? "";
if (process.env.NODE_ENV === "production" || url.includes("_test")) {
  console.error("Seed refuse : environnement de production ou base de test.");
  process.exit(1);
}

// Generateur pseudo-aleatoire reproductible : memes donnees a chaque execution.
let graine = 20261012;
function alea(): number {
  graine = (graine + 0x6d2b79f5) | 0;
  let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function choisir<T>(liste: readonly T[]): T {
  return liste[Math.floor(alea() * liste.length)];
}
function pondere<T>(items: ReadonlyArray<readonly [T, number]>): T {
  const total = items.reduce((s, [, p]) => s + p, 0);
  let r = alea() * total;
  for (const [valeur, poids] of items) {
    r -= poids;
    if (r < 0) return valeur;
  }
  return items[items.length - 1][0];
}

const FILIERES = [
  { code: "DEV", intitule: "Developpement d'applications", niveau: "BTS", secteurs: ["Numerique et informatique", "Commerce et services"] },
  { code: "ELEC", intitule: "Electricite du batiment", niveau: "BTS", secteurs: ["Electricite et energie", "Batiment et travaux publics"] },
  { code: "MECA", intitule: "Maintenance mecanique", niveau: "BTS", secteurs: ["Industrie et mecanique", "Agriculture et elevage"] },
  { code: "HOTE", intitule: "Hotellerie et restauration", niveau: "CAP", secteurs: ["Tourisme et hotellerie", "Commerce et services"] },
] as const;

const ANNEES = [2023, 2024, 2025];
const PAR_PROMOTION = 10;
const PRENOMS = ["Hery", "Voahangy", "Mamy", "Lalaina", "Tiana", "Fanja", "Niry", "Toky", "Aina", "Faly", "Hanta", "Rojo", "Soa", "Tsiory", "Mialy", "Andry", "Ony", "Lova", "Nomena", "Fenitra"];
const NOMS = ["Rakoto", "Rabe", "Randria", "Rasoa", "Razafy", "Andrianina", "Rakotomalala", "Ravelo", "Rasolofo", "Randrianasolo", "Raharison", "Rajaonarison", "Ratsimba", "Razanakolona"];
const VILLES = ["Antananarivo", "Toamasina", "Mahajanga", "Fianarantsoa", "Antsirabe", "Toliara"];

async function main() {
  const reset = process.argv.includes("--reset");
  if ((await prisma.diplome.count()) > 0 && !reset) {
    console.log("Des diplomes existent deja. Relancez avec --reset pour tout regenerer.");
    return;
  }
  if (reset) {
    await prisma.reponse.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.diplome.deleteMany();
    await prisma.campagne.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.filiere.deleteMany();
  }

  const filieres = [];
  for (const f of FILIERES) {
    filieres.push(
      await prisma.filiere.upsert({
        where: { code: f.code },
        update: { intitule: f.intitule, niveau: f.niveau },
        create: { code: f.code, intitule: f.intitule, niveau: f.niveau },
      }),
    );
  }

  const promotions = [];
  for (const f of filieres) {
    for (const annee of ANNEES) {
      promotions.push(
        await prisma.promotion.upsert({
          where: { filiereId_anneeSortie: { filiereId: f.id, anneeSortie: annee } },
          update: { effectif: PAR_PROMOTION },
          create: { filiereId: f.id, anneeSortie: annee, effectif: PAR_PROMOTION },
        }),
      );
    }
  }

  await prisma.diplome.createMany({
    data: promotions.flatMap((p) =>
      Array.from({ length: PAR_PROMOTION }, () => ({
        nom: choisir(NOMS),
        prenom: choisir(PRENOMS),
        promotionId: p.id,
      })),
    ),
  });
  const diplomes = await prisma.diplome.findMany({ select: { id: true } });

  const maintenant = Date.now();
  const debut = new Date(maintenant - 7 * 24 * 3600 * 1000);
  const campagne = await prisma.campagne.create({
    data: {
      titre: "Insertion des diplomes 2023-2025",
      dateDebut: debut,
      dateFin: new Date(maintenant + 30 * 24 * 3600 * 1000),
      statut: "OUVERTE",
    },
  });

  await prisma.invitation.createMany({
    data: diplomes.map((d) => ({
      campagneId: campagne.id,
      diplomeId: d.id,
      jeton: randomBytes(32).toString("base64url"),
    })),
  });

  const invitations = await prisma.invitation.findMany({
    where: { campagneId: campagne.id },
    orderBy: { id: "asc" },
    include: {
      diplome: { select: { promotion: { select: { filiere: { select: { code: true } } } } } },
    },
  });

  const reponses: Prisma.ReponseCreateManyInput[] = [];
  const repondus = new Set<number>();
  for (const inv of invitations) {
    if (alea() > 0.65) continue;
    repondus.add(inv.id);
    const filiere = FILIERES.find((f) => f.code === inv.diplome.promotion.filiere.code)!;
    const situation = pondere<Situation>([
      ["EMPLOI_SALARIE", 40],
      ["EMPLOI_INDEPENDANT", 12],
      ["POURSUITE_ETUDES", 12],
      ["RECHERCHE_EMPLOI", 28],
      ["AUTRE", 8],
    ]);
    const enEmploi = situation === "EMPLOI_SALARIE" || situation === "EMPLOI_INDEPENDANT";
    const typeContrat: TypeContrat | null = !enEmploi
      ? null
      : situation === "EMPLOI_INDEPENDANT"
        ? "INDEPENDANT"
        : pondere<TypeContrat>([["CDI", 30], ["CDD", 40], ["STAGE", 15], ["OCCASIONNEL", 15]]);

    reponses.push({
      invitationId: inv.id,
      situation,
      secteur: enEmploi ? (alea() < 0.7 ? choisir(filiere.secteurs) : choisir(SECTEURS)) : null,
      typeContrat,
      delaiInsertionMois: enEmploi ? Math.min(18, Math.floor(alea() * alea() * 24)) : null,
      ville: choisir(VILLES),
      adequationFormation: enEmploi ? pondere([[1, 5], [2, 10], [3, 25], [4, 35], [5, 25]]) : null,
      consentement: true,
      soumiseLe: new Date(debut.getTime() + alea() * (maintenant - debut.getTime())),
    });
  }
  await prisma.reponse.createMany({ data: reponses });

  const base = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/+$/, "");
  console.log(`Filieres : ${filieres.length}, promotions : ${promotions.length}, diplomes : ${diplomes.length}`);
  console.log(`Invitations : ${invitations.length}, reponses : ${reponses.length}`);
  console.log("Liens d'enquete a tester (pas encore repondus) :");
  invitations
    .filter((i) => !repondus.has(i.id))
    .slice(0, 3)
    .forEach((i) => console.log(`  ${base}/enquete/${i.jeton}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
