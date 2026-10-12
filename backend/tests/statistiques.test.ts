import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { setupTestDb } from "./helpers";

let admin = "";
let consultant = "";
let campagneA = 0;
let campagneB = 0;
let filiereDev = 0;
let filiereElec = 0;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const base = { ville: "Antananarivo", consentement: true };

const reponsesDev = [
  { situation: "EMPLOI_SALARIE", secteur: "Numerique et informatique", typeContrat: "CDI", delaiInsertionMois: 2, adequationFormation: 5 },
  { situation: "EMPLOI_SALARIE", secteur: "Numerique et informatique", typeContrat: "CDD", delaiInsertionMois: 4, adequationFormation: 4 },
  { situation: "EMPLOI_SALARIE", secteur: "Commerce et services", typeContrat: "CDD", delaiInsertionMois: 6, adequationFormation: 3 },
  { situation: "EMPLOI_INDEPENDANT", secteur: "Commerce et services", typeContrat: "INDEPENDANT", delaiInsertionMois: 0, adequationFormation: 4 },
  { situation: "POURSUITE_ETUDES" },
  { situation: "RECHERCHE_EMPLOI" },
  { situation: "RECHERCHE_EMPLOI" },
  { situation: "AUTRE" },
];
const reponsesElec = [
  { situation: "EMPLOI_SALARIE", secteur: "Electricite et energie", typeContrat: "CDI", delaiInsertionMois: 10, adequationFormation: 2 },
  { situation: "RECHERCHE_EMPLOI" },
];

async function creerDiplomes(promotionId: number, n: number) {
  await prisma.diplome.createMany({
    data: Array.from({ length: n }, (_, i) => ({
      nom: `Zzxqk${promotionId}x${i}`,
      prenom: "Test",
      promotionId,
      contact: "secret@exemple.com",
    })),
  });
  return prisma.diplome.findMany({ where: { promotionId }, orderBy: { id: "asc" } });
}

async function inviter(campagneId: number, diplomes: { id: number }[]) {
  const invitations = [];
  for (const d of diplomes) {
    invitations.push(
      await prisma.invitation.create({
        data: { campagneId, diplomeId: d.id, jeton: randomBytes(32).toString("base64url") },
      }),
    );
  }
  return invitations;
}

beforeAll(async () => {
  const t = await setupTestDb();
  admin = t.adminToken;
  consultant = t.consultantToken;

  const dev = await prisma.filiere.create({ data: { code: "DEV", intitule: "Developpement", niveau: "BTS" } });
  const elec = await prisma.filiere.create({ data: { code: "ELEC", intitule: "Electricite", niveau: "BTS" } });
  filiereDev = dev.id;
  filiereElec = elec.id;
  const promoDev = await prisma.promotion.create({ data: { filiereId: dev.id, anneeSortie: 2025 } });
  const promoElec = await prisma.promotion.create({ data: { filiereId: elec.id, anneeSortie: 2025 } });
  const promoDev2024 = await prisma.promotion.create({ data: { filiereId: dev.id, anneeSortie: 2024 } });

  const debut = new Date(Date.now() - 24 * 3600 * 1000);
  const fin = new Date(Date.now() + 24 * 3600 * 1000);
  const a = await prisma.campagne.create({ data: { titre: "Campagne A", statut: "OUVERTE", dateDebut: debut, dateFin: fin } });
  const b = await prisma.campagne.create({ data: { titre: "Campagne B", statut: "OUVERTE", dateDebut: debut, dateFin: fin } });
  campagneA = a.id;
  campagneB = b.id;

  const invDev = await inviter(a.id, await creerDiplomes(promoDev.id, 10));
  const invElec = await inviter(a.id, await creerDiplomes(promoElec.id, 4));
  await inviter(b.id, await creerDiplomes(promoDev2024.id, 2));

  await prisma.reponse.createMany({
    data: reponsesDev.map((r, i) => ({ invitationId: invDev[i].id, ...base, ...r })) as never,
  });
  await prisma.reponse.createMany({
    data: reponsesElec.map((r, i) => ({ invitationId: invElec[i].id, ...base, ...r })) as never,
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Statistiques globales d une campagne", () => {
  it("calcule les indicateurs du cahier des charges", async () => {
    const res = await request(app).get(`/api/statistiques?campagneId=${campagneA}`).set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      invitations: 14,
      reponses: 10,
      tauxReponse: 71.4,
      enEmploi: 5,
      tauxInsertion: 50,
      tauxPoursuiteEtudes: 10,
      tauxRechercheEmploi: 30,
      delaiMoyenMois: 4.4,
      adequationMoyenne: 3.6,
      fiable: true,
    });
  });

  it("repartit les situations des repondants", async () => {
    const res = await request(app).get(`/api/statistiques?campagneId=${campagneA}`).set(auth(admin));
    const effectifs = Object.fromEntries(
      res.body.situations.map((s: { situation: string; effectif: number }) => [s.situation, s.effectif]),
    );
    expect(effectifs).toEqual({
      EMPLOI_SALARIE: 4,
      EMPLOI_INDEPENDANT: 1,
      POURSUITE_ETUDES: 1,
      RECHERCHE_EMPLOI: 3,
      AUTRE: 1,
    });
  });

  it("repartit secteurs et contrats parmi les personnes en emploi", async () => {
    const res = await request(app).get(`/api/statistiques?campagneId=${campagneA}`).set(auth(admin));
    expect(res.body.secteurs).toEqual([
      { secteur: "Commerce et services", effectif: 2, pourcentage: 40 },
      { secteur: "Numerique et informatique", effectif: 2, pourcentage: 40 },
      { secteur: "Electricite et energie", effectif: 1, pourcentage: 20 },
    ]);
    expect(res.body.contrats).toEqual([
      { typeContrat: "CDD", effectif: 2, pourcentage: 40 },
      { typeContrat: "CDI", effectif: 2, pourcentage: 40 },
      { typeContrat: "INDEPENDANT", effectif: 1, pourcentage: 20 },
    ]);
  });
});

describe("Filtres", () => {
  it("filtre par filiere (DEV)", async () => {
    const res = await request(app)
      .get(`/api/statistiques?campagneId=${campagneA}&filiereId=${filiereDev}`)
      .set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      invitations: 10,
      reponses: 8,
      tauxReponse: 80,
      tauxInsertion: 50,
      tauxPoursuiteEtudes: 12.5,
      tauxRechercheEmploi: 25,
      delaiMoyenMois: 3,
      adequationMoyenne: 4,
      fiable: true,
    });
  });

  it("signale un resultat peu fiable sous le seuil (RG-10)", async () => {
    const res = await request(app)
      .get(`/api/statistiques?campagneId=${campagneA}&filiereId=${filiereElec}`)
      .set(auth(admin));
    expect(res.body).toMatchObject({
      invitations: 4,
      reponses: 2,
      tauxReponse: 50,
      tauxInsertion: 50,
      delaiMoyenMois: 10,
      adequationMoyenne: 2,
      fiable: false,
      seuilFiabilite: 5,
    });
  });

  it("retourne des valeurs nulles quand il n y a aucune reponse", async () => {
    const res = await request(app).get(`/api/statistiques?campagneId=${campagneB}`).set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      invitations: 2,
      reponses: 0,
      tauxReponse: 0,
      tauxInsertion: null,
      delaiMoyenMois: null,
      adequationMoyenne: null,
      fiable: false,
    });
    expect(res.body.secteurs).toEqual([]);
  });

  it("combine campagne et annee de sortie", async () => {
    const res = await request(app)
      .get(`/api/statistiques?campagneId=${campagneA}&anneeSortie=2024`)
      .set(auth(admin));
    expect(res.body.invitations).toBe(0);
    expect(res.body.tauxReponse).toBeNull();
  });

  it("refuse un filtre invalide", async () => {
    const res = await request(app).get("/api/statistiques?campagneId=abc").set(auth(admin));
    expect(res.status).toBe(400);
  });
});

describe("Statistiques par filiere", () => {
  it("compare les filieres", async () => {
    const res = await request(app)
      .get(`/api/statistiques/par-filiere?campagneId=${campagneA}`)
      .set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({
      filiere: { code: "DEV" },
      reponses: 8,
      tauxInsertion: 50,
      fiable: true,
    });
    expect(res.body[1]).toMatchObject({
      filiere: { code: "ELEC" },
      reponses: 2,
      fiable: false,
    });
  });
});

describe("Acces et confidentialite", () => {
  it("refuse sans jeton", async () => {
    const res = await request(app).get("/api/statistiques");
    expect(res.status).toBe(401);
  });

  it("autorise le consultant (donnees agregees)", async () => {
    const res = await request(app).get(`/api/statistiques?campagneId=${campagneA}`).set(auth(consultant));
    expect(res.status).toBe(200);
  });

  it("ne renvoie aucune donnee personnelle (RG-04)", async () => {
    const global = await request(app).get(`/api/statistiques?campagneId=${campagneA}`).set(auth(consultant));
    const parFiliere = await request(app)
      .get(`/api/statistiques/par-filiere?campagneId=${campagneA}`)
      .set(auth(consultant));
    const texte = JSON.stringify([global.body, parFiliere.body]);
    expect(texte).not.toContain("Zzxqk");
    expect(texte).not.toContain("secret@exemple.com");
    expect(texte).not.toContain("jeton");
  });
});
