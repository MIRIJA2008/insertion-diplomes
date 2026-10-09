import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { SECTEURS } from "../src/modules/enquete/enquete.schemas";
import { setupTestDb } from "./helpers";

const jeton = () => randomBytes(32).toString("base64url");
const J = {
  ok: jeton(),
  manque: jeton(),
  sansConsent: jeton(),
  rg08: jeton(),
  note: jeton(),
  secteur: jeton(),
  course: jeton(),
  brouillon: jeton(),
  cloturee: jeton(),
  expiree: jeton(),
};

const emploi = {
  consentement: true,
  situation: "EMPLOI_SALARIE",
  secteur: SECTEURS[0],
  typeContrat: "CDI",
  delaiInsertionMois: 3,
  ville: "Antananarivo",
  adequationFormation: 4,
};

type Statut = "BROUILLON" | "OUVERTE" | "CLOTUREE";

beforeAll(async () => {
  await setupTestDb();
  const filiere = await prisma.filiere.create({
    data: { code: "DEV", intitule: "Developpement", niveau: "BTS" },
  });
  const promotion = await prisma.promotion.create({
    data: { filiereId: filiere.id, anneeSortie: 2025 },
  });
  const d: { id: number }[] = [];
  for (let i = 1; i <= 7; i++) {
    d.push(
      await prisma.diplome.create({
        data: { nom: `Rabe${i}`, prenom: "Jean", promotionId: promotion.id },
      }),
    );
  }

  const jour = 24 * 3600 * 1000;
  const hier = new Date(Date.now() - jour);
  const demain = new Date(Date.now() + jour);
  const avantHier = new Date(Date.now() - 2 * jour);
  const mk = (titre: string, statut: Statut, debut: Date, fin: Date) =>
    prisma.campagne.create({ data: { titre, statut, dateDebut: debut, dateFin: fin } });
  const inv = (campagneId: number, diplomeId: number, j: string) =>
    prisma.invitation.create({ data: { campagneId, diplomeId, jeton: j } });

  const ouverte = await mk("Enquete ouverte", "OUVERTE", hier, demain);
  const brouillon = await mk("Enquete brouillon", "BROUILLON", hier, demain);
  const cloturee = await mk("Enquete cloturee", "CLOTUREE", avantHier, hier);
  const expiree = await mk("Enquete expiree", "OUVERTE", avantHier, hier);

  await inv(ouverte.id, d[0].id, J.ok);
  await inv(ouverte.id, d[1].id, J.manque);
  await inv(ouverte.id, d[2].id, J.sansConsent);
  await inv(ouverte.id, d[3].id, J.rg08);
  await inv(ouverte.id, d[4].id, J.note);
  await inv(ouverte.id, d[5].id, J.secteur);
  await inv(ouverte.id, d[6].id, J.course);
  await inv(brouillon.id, d[0].id, J.brouillon);
  await inv(cloturee.id, d[0].id, J.cloturee);
  await inv(expiree.id, d[0].id, J.expiree);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Page de l enquete (publique)", () => {
  it("affiche l etat et les secteurs, sans donnees personnelles", async () => {
    const res = await request(app).get(`/api/enquete/${J.ok}`);
    expect(res.status).toBe(200);
    expect(res.body.etat).toBe("OUVERTE");
    expect(res.body.titre).toBe("Enquete ouverte");
    expect(res.body.secteurs).toHaveLength(SECTEURS.length);
    expect(JSON.stringify(res.body)).not.toContain("Rabe");
  });

  it("retourne 404 pour un lien inconnu", async () => {
    const res = await request(app).get(`/api/enquete/${jeton()}`);
    expect(res.status).toBe(404);
  });

  it("refuse un lien mal forme", async () => {
    const res = await request(app).get("/api/enquete/court");
    expect(res.status).toBe(400);
  });
});

describe("Envoi des reponses (publique)", () => {
  it("enregistre une reponse valide", async () => {
    const res = await request(app).post(`/api/enquete/${J.ok}`).send(emploi);
    expect(res.status).toBe(201);
    const stockee = await prisma.reponse.findFirst({ where: { invitation: { jeton: J.ok } } });
    expect(stockee?.situation).toBe("EMPLOI_SALARIE");
    expect(stockee?.consentement).toBe(true);
    expect(stockee?.ville).toBe("Antananarivo");
  });

  it("refuse une deuxieme reponse avec le meme lien (RG-02)", async () => {
    const res = await request(app).post(`/api/enquete/${J.ok}`).send(emploi);
    expect(res.status).toBe(409);
  });

  it("indique que le lien a deja ete utilise", async () => {
    const res = await request(app).get(`/api/enquete/${J.ok}`);
    expect(res.body.etat).toBe("DEJA_REPONDU");
  });

  it("exige le consentement (RG-05)", async () => {
    const res = await request(app)
      .post(`/api/enquete/${J.sansConsent}`)
      .send({ ...emploi, consentement: false });
    expect(res.status).toBe(400);
    const stockee = await prisma.reponse.findFirst({ where: { invitation: { jeton: J.sansConsent } } });
    expect(stockee).toBeNull();
  });

  it("exige le secteur pour une personne en emploi", async () => {
    const res = await request(app)
      .post(`/api/enquete/${J.manque}`)
      .send({ ...emploi, secteur: undefined });
    expect(res.status).toBe(400);
  });

  it("ignore les champs d emploi pour une personne en recherche d emploi (RG-08)", async () => {
    const res = await request(app)
      .post(`/api/enquete/${J.rg08}`)
      .send({ ...emploi, situation: "RECHERCHE_EMPLOI" });
    expect(res.status).toBe(201);
    const stockee = await prisma.reponse.findFirst({ where: { invitation: { jeton: J.rg08 } } });
    expect(stockee?.situation).toBe("RECHERCHE_EMPLOI");
    expect(stockee?.secteur).toBeNull();
    expect(stockee?.typeContrat).toBeNull();
    expect(stockee?.delaiInsertionMois).toBeNull();
    expect(stockee?.adequationFormation).toBeNull();
  });

  it("refuse une note hors de 1 a 5", async () => {
    const res = await request(app)
      .post(`/api/enquete/${J.note}`)
      .send({ ...emploi, adequationFormation: 6 });
    expect(res.status).toBe(400);
  });

  it("refuse un secteur hors de la liste", async () => {
    const res = await request(app)
      .post(`/api/enquete/${J.secteur}`)
      .send({ ...emploi, secteur: "Secteur invente" });
    expect(res.status).toBe(400);
  });

  it("refuse si la campagne est en brouillon (RG-03)", async () => {
    const res = await request(app).post(`/api/enquete/${J.brouillon}`).send(emploi);
    expect(res.status).toBe(409);
  });

  it("refuse si la campagne est cloturee (RG-03)", async () => {
    const res = await request(app).post(`/api/enquete/${J.cloturee}`).send(emploi);
    expect(res.status).toBe(409);
  });

  it("refuse si la date de fin est depassee (RG-03)", async () => {
    const res = await request(app).post(`/api/enquete/${J.expiree}`).send(emploi);
    expect(res.status).toBe(409);
  });

  it("accepte une seule reponse si deux envois arrivent en meme temps", async () => {
    const [a, b] = await Promise.all([
      request(app).post(`/api/enquete/${J.course}`).send(emploi),
      request(app).post(`/api/enquete/${J.course}`).send(emploi),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    const n = await prisma.reponse.count({ where: { invitation: { jeton: J.course } } });
    expect(n).toBe(1);
  });
});
