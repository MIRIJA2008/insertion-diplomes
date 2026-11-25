import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { setupTestDb } from "./helpers";

let adminToken = "";
let consultantToken = "";
let adminId = 0;
let consultantId = 0;
let candidatId = 0;

beforeAll(async () => {
  const tokens = await setupTestDb();
  adminToken = tokens.adminToken;
  consultantToken = tokens.consultantToken;

  const admin = await prisma.utilisateur.findUnique({
    where: { email: "admin@test.local" },
    select: { id: true },
  });
  const consultant = await prisma.utilisateur.findUnique({
    where: { email: "consultant@test.local" },
    select: { id: true },
  });

  if (!admin || !consultant) {
    throw new Error("Comptes de test introuvables.");
  }

  adminId = admin.id;
  consultantId = consultant.id;

  const candidat = await prisma.utilisateur.create({
    data: {
      nom: "Candidat Test",
      email: "candidat-admin@test.local",
      motDePasseHash: "hash-test-non-utilise",
      role: "CANDIDAT",
      profilCandidat: {
        create: {
          diplomes: [],
          competences: [],
          situationPro: "INCONNU",
        },
      },
    },
    select: { id: true },
  });

  candidatId = candidat.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Tableau de bord administratif", () => {
  it("refuse l'accès sans authentification", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.status).toBe(401);
  });

  it("autorise l'administrateur et retourne les indicateurs", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const champs = [
      "totalDiplomes", "totalRecruteurs", "totalOffres",
      "totalCandidatures", "offresOuvertes",
      "candidaturesEnAttente", "suggestionsEnAttente"
    ];

    for (const champ of champs) {
      expect(res.body[champ]).toEqual(expect.any(Number));
      expect(res.body[champ]).toBeGreaterThanOrEqual(0);
    }

    expect(res.body.evolutionInscriptions).toHaveLength(6);
  });

  it("autorise également le consultant", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${consultantToken}`);

    expect(res.status).toBe(200);
  });

  it("retourne six mois dans l'ordre chronologique", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const mois = res.body.evolutionInscriptions.map(
      (element: { mois: string }) => element.mois
    );

    expect(mois).toEqual([...mois].sort());
    expect(mois).toHaveLength(6);

    for (const element of res.body.evolutionInscriptions) {
      expect(element.count).toEqual(expect.any(Number));
    }
  });
});
describe("Administration des fiches diplômés", () => {
  it("refuse la consultation sans authentification", async () => {
    const res = await request(app).get(`/api/admin/diplomes/${candidatId}`);
    expect(res.status).toBe(401);
  });

  it("autorise le consultant à consulter une fiche candidat", async () => {
    const res = await request(app)
      .get(`/api/admin/diplomes/${candidatId}`)
      .set("Authorization", `Bearer ${consultantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(candidatId);
    expect(res.body.profilCandidat).toBeDefined();
    expect(res.body.motDePasseHash).toBeUndefined();
  });

  it("autorise l'administrateur à consulter une fiche candidat", async () => {
    const res = await request(app)
      .get(`/api/admin/diplomes/${candidatId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(candidatId);
  });

  it("ne permet pas de consulter la fiche d'un compte consultant", async () => {
    const res = await request(app)
      .get(`/api/admin/diplomes/${consultantId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it("retourne 404 pour un candidat inexistant", async () => {
    const res = await request(app)
      .get("/api/admin/diplomes/999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it("interdit au consultant de vérifier un profil", async () => {
    const res = await request(app)
      .patch(`/api/admin/diplomes/${candidatId}/verifier`)
      .set("Authorization", `Bearer ${consultantToken}`)
      .send({ verifie: true });

    expect(res.status).toBe(403);
  });

  it("interdit au consultant de modifier la situation professionnelle", async () => {
    const res = await request(app)
      .patch(`/api/admin/diplomes/${candidatId}/situation`)
      .set("Authorization", `Bearer ${consultantToken}`)
      .send({ situationPro: "EN_CDI" });

    expect(res.status).toBe(403);
  });

  it("permet à l'administrateur de vérifier un profil et journalise l'action", async () => {
    const res = await request(app)
      .patch(`/api/admin/diplomes/${candidatId}/verifier`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ verifie: true });

    expect(res.status).toBe(200);
    expect(res.body.verifie).toBe(true);

    const profil = await prisma.profilCandidat.findUnique({
      where: { utilisateurId: candidatId },
    });
    expect(profil?.verifie).toBe(true);

    const log = await prisma.activiteLog.findFirst({
      where: {
        utilisateurId: adminId,
        action: "PROFIL_DIPLOME_VERIFIE",
        details: { contains: `candidat ${candidatId}` },
      },
    });
    expect(log).not.toBeNull();
  });

  it("permet à l'administrateur de modifier la situation et journalise l'action", async () => {
    const res = await request(app)
      .patch(`/api/admin/diplomes/${candidatId}/situation`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ situationPro: "EN_CDI" });

    expect(res.status).toBe(200);
    expect(res.body.situationPro).toBe("EN_CDI");

    const profil = await prisma.profilCandidat.findUnique({
      where: { utilisateurId: candidatId },
    });
    expect(profil?.situationPro).toBe("EN_CDI");

    const log = await prisma.activiteLog.findFirst({
      where: {
        utilisateurId: adminId,
        action: "SITUATION_DIPLOME_MODIFIEE",
        details: { contains: `candidat ${candidatId}` },
      },
    });
    expect(log).not.toBeNull();
  });

  it("refuse de vérifier un compte qui n'est pas candidat", async () => {
    const res = await request(app)
      .patch(`/api/admin/diplomes/${consultantId}/verifier`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ verifie: true });

    expect(res.status).toBe(404);
  });

  it("refuse de modifier la situation d'un compte qui n'est pas candidat", async () => {
    const res = await request(app)
      .patch(`/api/admin/diplomes/${consultantId}/situation`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ situationPro: "EN_CDI" });

    expect(res.status).toBe(404);
  });
});
