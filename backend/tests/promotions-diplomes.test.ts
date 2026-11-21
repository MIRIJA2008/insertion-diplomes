import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { setupTestDb } from "./helpers";

let admin = "";
let consultant = "";
let filiereId = 0;
let promoA = 0;
let promoB = 0;
let diplomeId = 0;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  const t = await setupTestDb();
  admin = t.adminToken;
  consultant = t.consultantToken;
  const filiere = await prisma.filiere.create({
    data: { code: "DEV", intitule: "Developpement", niveau: "BTS" },
  });
  filiereId = filiere.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Promotions", () => {
  it("l admin cree une promotion", async () => {
    const res = await request(app)
      .post("/api/promotions")
      .set(auth(admin))
      .send({ filiereId, anneeSortie: 2025, effectif: 30 });
    expect(res.status).toBe(201);
    promoA = res.body.id;
  });

  it("refuse une deuxieme promotion pour la meme filiere et la meme annee", async () => {
    const res = await request(app)
      .post("/api/promotions")
      .set(auth(admin))
      .send({ filiereId, anneeSortie: 2025 });
    expect(res.status).toBe(409);
  });

  it("refuse une filiere inexistante", async () => {
    const res = await request(app)
      .post("/api/promotions")
      .set(auth(admin))
      .send({ filiereId: 999999, anneeSortie: 2025 });
    expect(res.status).toBe(404);
  });

  it("refuse une annee invalide", async () => {
    const res = await request(app)
      .post("/api/promotions")
      .set(auth(admin))
      .send({ filiereId, anneeSortie: 1800 });
    expect(res.status).toBe(400);
  });

  it("le consultant peut lire mais pas creer", async () => {
    const lecture = await request(app).get("/api/promotions").set(auth(consultant));
    expect(lecture.status).toBe(200);
    expect(lecture.body.length).toBeGreaterThanOrEqual(1);

    const creation = await request(app)
      .post("/api/promotions")
      .set(auth(consultant))
      .send({ filiereId, anneeSortie: 2023 });
    expect(creation.status).toBe(403);
  });

  it("cree une seconde promotion", async () => {
    const res = await request(app)
      .post("/api/promotions")
      .set(auth(admin))
      .send({ filiereId, anneeSortie: 2024 });
    expect(res.status).toBe(201);
    promoB = res.body.id;
  });
});

describe("Diplomes", () => {
  it("l admin cree un diplome", async () => {
    const res = await request(app)
      .post("/api/diplomes")
      .set(auth(admin))
      .send({ nom: "Rabe", prenom: "Jean", promotionId: promoA, contact: "jean@exemple.com" });
    expect(res.status).toBe(201);
    diplomeId = res.body.id;
  });

  it("refuse une promotion inexistante", async () => {
    const res = await request(app)
      .post("/api/diplomes")
      .set(auth(admin))
      .send({ nom: "Rabe", prenom: "Paul", promotionId: 999999 });
    expect(res.status).toBe(404);
  });

  it("refuse des donnees invalides", async () => {
    const res = await request(app)
      .post("/api/diplomes")
      .set(auth(admin))
      .send({ nom: "", prenom: "X", promotionId: promoA });
    expect(res.status).toBe(400);
  });

  it("interdit au consultant de lire les diplomes (donnees personnelles)", async () => {
    const res = await request(app).get("/api/diplomes").set(auth(consultant));
    expect(res.status).toBe(403);
  });

  it("recherche sans tenir compte des majuscules", async () => {
    await prisma.diplome.create({
      data: { nom: "Zafimahova", prenom: "Hery", promotionId: promoA },
    });
    const res = await request(app).get("/api/diplomes?q=zafimah").set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].nom).toBe("Zafimahova");
  });

  it("pagine les resultats", async () => {
    await prisma.diplome.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        nom: `Etudiant${String(i + 1).padStart(2, "0")}`,
        prenom: "Test",
        promotionId: promoB,
      })),
    });
    const res = await request(app)
      .get(`/api/diplomes?promotionId=${promoB}&limite=10&page=3`)
      .set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pagination.total).toBe(25);
    expect(res.body.pagination.pages).toBe(3);
  });

  it("filtre par annee de sortie", async () => {
    const res = await request(app).get("/api/diplomes?anneeSortie=2024&limite=100").set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(25);
  });

  it("modifie un diplome", async () => {
    const res = await request(app)
      .put(`/api/diplomes/${diplomeId}`)
      .set(auth(admin))
      .send({ nom: "Rabe", prenom: "Jean-Luc", promotionId: promoA, contact: "" });
    expect(res.status).toBe(200);
    expect(res.body.prenom).toBe("Jean-Luc");
    expect(res.body.contact).toBeNull();
  });

  it("refuse de supprimer une promotion qui a des diplomes", async () => {
    const res = await request(app).delete(`/api/promotions/${promoA}`).set(auth(admin));
    expect(res.status).toBe(409);
  });

  it("supprime un diplome", async () => {
    const res = await request(app).delete(`/api/diplomes/${diplomeId}`).set(auth(admin));
    expect(res.status).toBe(204);
    const apres = await request(app).get(`/api/diplomes/${diplomeId}`).set(auth(admin));
    expect(apres.status).toBe(404);
  });
  it("supprime definitivement le diplome, ses invitations et ses reponses", async () => {
    const campagne = await prisma.campagne.create({
      data: {
        titre: "Test suppression en cascade",
        dateDebut: new Date("2026-11-01T00:00:00.000Z"),
        dateFin: new Date("2026-12-15T00:00:00.000Z"),
      },
    });

    const diplome = await prisma.diplome.create({
      data: {
        nom: "TestCascade",
        prenom: "Suppression",
        promotionId: promoB,
      },
    });

    const invitation = await prisma.invitation.create({
      data: {
        campagneId: campagne.id,
        diplomeId: diplome.id,
        jeton: `cascade-${Date.now()}-${Math.random()}`,
      },
    });

    const reponse = await prisma.reponse.create({
      data: {
        invitationId: invitation.id,
        situation: "EMPLOI_SALARIE",
        ville: "Antananarivo",
        consentement: true,
      },
    });

    const suppression = await request(app)
      .delete(`/api/diplomes/${diplome.id}`)
      .set(auth(admin));

    expect(suppression.status).toBe(204);

    const diplomeApres = await prisma.diplome.findUnique({
      where: { id: diplome.id },
      select: { id: true },
    });
    const invitationApres = await prisma.invitation.findUnique({
      where: { id: invitation.id },
      select: { id: true },
    });
    const reponseApres = await prisma.reponse.findUnique({
      where: { id: reponse.id },
      select: { id: true },
    });

    expect(diplomeApres).toBeNull();
    expect(invitationApres).toBeNull();
    expect(reponseApres).toBeNull();
  });
});
