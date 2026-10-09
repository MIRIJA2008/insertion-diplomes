import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { setupTestDb } from "./helpers";

let admin = "";
let consultant = "";
let promotionId = 0;
let campagneId = 0;
let brouillonId = 0;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const dates = { dateDebut: "2026-11-01", dateFin: "2026-12-15" };

beforeAll(async () => {
  const t = await setupTestDb();
  admin = t.adminToken;
  consultant = t.consultantToken;
  const filiere = await prisma.filiere.create({
    data: { code: "DEV", intitule: "Developpement", niveau: "BTS" },
  });
  const promotion = await prisma.promotion.create({
    data: { filiereId: filiere.id, anneeSortie: 2025 },
  });
  promotionId = promotion.id;
  await prisma.diplome.createMany({
    data: [
      { nom: "Rabe", prenom: "Jean", promotionId },
      { nom: "Rakoto", prenom: "Hery", promotionId },
      { nom: "Randria", prenom: "Voahangy", promotionId },
    ],
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Campagnes", () => {
  it("l admin cree une campagne en brouillon", async () => {
    const res = await request(app)
      .post("/api/campagnes")
      .set(auth(admin))
      .send({ titre: "Insertion promotion 2025", ...dates });
    expect(res.status).toBe(201);
    expect(res.body.statut).toBe("BROUILLON");
    campagneId = res.body.id;
  });

  it("refuse une date de fin avant la date de debut", async () => {
    const res = await request(app)
      .post("/api/campagnes")
      .set(auth(admin))
      .send({ titre: "Dates incoherentes", dateDebut: "2026-12-15", dateFin: "2026-11-01" });
    expect(res.status).toBe(400);
  });

  it("le consultant peut lire mais pas creer", async () => {
    const lecture = await request(app).get("/api/campagnes").set(auth(consultant));
    expect(lecture.status).toBe(200);
    const creation = await request(app)
      .post("/api/campagnes")
      .set(auth(consultant))
      .send({ titre: "Interdit", ...dates });
    expect(creation.status).toBe(403);
  });

  it("refuse d ouvrir une campagne sans invitation", async () => {
    const res = await request(app).post(`/api/campagnes/${campagneId}/ouvrir`).set(auth(admin));
    expect(res.status).toBe(409);
  });
});

describe("Invitations", () => {
  it("genere une invitation par diplome", async () => {
    const res = await request(app)
      .post(`/api/campagnes/${campagneId}/invitations`)
      .set(auth(admin))
      .send({ promotionId });
    expect(res.status).toBe(201);
    expect(res.body.invitationsCreees).toBe(3);
  });

  it("ne cree pas de doublon (RG-01)", async () => {
    const res = await request(app)
      .post(`/api/campagnes/${campagneId}/invitations`)
      .set(auth(admin))
      .send({ promotionId });
    expect(res.status).toBe(201);
    expect(res.body.invitationsCreees).toBe(0);
    expect(res.body.dejaExistantes).toBe(3);
  });

  it("refuse si aucun diplome ne correspond", async () => {
    const res = await request(app)
      .post(`/api/campagnes/${campagneId}/invitations`)
      .set(auth(admin))
      .send({ promotionId: 999999 });
    expect(res.status).toBe(404);
  });

  it("interdit au consultant de lister les invitations", async () => {
    const res = await request(app)
      .get(`/api/campagnes/${campagneId}/invitations`)
      .set(auth(consultant));
    expect(res.status).toBe(403);
  });

  it("produit des jetons uniques et longs avec le lien", async () => {
    const res = await request(app)
      .get(`/api/campagnes/${campagneId}/invitations?limite=100`)
      .set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    const jetons = res.body.data.map((i: { jeton: string }) => i.jeton);
    expect(new Set(jetons).size).toBe(3);
    for (const i of res.body.data) {
      expect(i.jeton.length).toBeGreaterThanOrEqual(43);
      expect(i.lien.startsWith("http")).toBe(true);
      expect(i.lien.endsWith(i.jeton)).toBe(true);
    }
  });

  it("calcule le taux de reponse", async () => {
    const avant = await request(app).get(`/api/campagnes/${campagneId}`).set(auth(consultant));
    expect(avant.body.resume).toEqual({ invitations: 3, reponses: 0, tauxReponse: 0 });

    const invitation = await prisma.invitation.findFirstOrThrow({ where: { campagneId } });
    await prisma.reponse.create({
      data: {
        invitationId: invitation.id,
        situation: "EMPLOI_SALARIE",
        ville: "Antananarivo",
        consentement: true,
      },
    });
    const apres = await request(app).get(`/api/campagnes/${campagneId}`).set(auth(consultant));
    expect(apres.body.resume.reponses).toBe(1);
    expect(apres.body.resume.tauxReponse).toBe(33.3);
  });

  it("filtre les invitations selon la reponse", async () => {
    const repondu = await request(app)
      .get(`/api/campagnes/${campagneId}/invitations?statut=repondu`)
      .set(auth(admin));
    expect(repondu.body.pagination.total).toBe(1);
    const attente = await request(app)
      .get(`/api/campagnes/${campagneId}/invitations?statut=en_attente`)
      .set(auth(admin));
    expect(attente.body.pagination.total).toBe(2);
  });

  it("genere un QR code PNG", async () => {
    const invitation = await prisma.invitation.findFirstOrThrow({ where: { campagneId } });
    const res = await request(app)
      .get(`/api/campagnes/${campagneId}/invitations/${invitation.id}/qrcode`)
      .set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/png");
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.subarray(1, 4).toString()).toBe("PNG");
  });
});

describe("Cycle de vie d une campagne", () => {
  it("ouvre la campagne", async () => {
    const res = await request(app).post(`/api/campagnes/${campagneId}/ouvrir`).set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.statut).toBe("OUVERTE");
  });

  it("refuse de modifier une campagne ouverte", async () => {
    const res = await request(app)
      .put(`/api/campagnes/${campagneId}`)
      .set(auth(admin))
      .send({ titre: "Autre titre", ...dates });
    expect(res.status).toBe(409);
  });

  it("refuse de supprimer une campagne ouverte", async () => {
    const res = await request(app).delete(`/api/campagnes/${campagneId}`).set(auth(admin));
    expect(res.status).toBe(409);
  });

  it("cloture la campagne", async () => {
    const res = await request(app).post(`/api/campagnes/${campagneId}/cloturer`).set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.statut).toBe("CLOTUREE");
  });

  it("refuse de generer des invitations apres la cloture", async () => {
    const res = await request(app)
      .post(`/api/campagnes/${campagneId}/invitations`)
      .set(auth(admin))
      .send({ promotionId });
    expect(res.status).toBe(409);
  });

  it("refuse de cloturer une campagne en brouillon", async () => {
    const creation = await request(app)
      .post("/api/campagnes")
      .set(auth(admin))
      .send({ titre: "Brouillon a supprimer", ...dates });
    brouillonId = creation.body.id;
    const res = await request(app).post(`/api/campagnes/${brouillonId}/cloturer`).set(auth(admin));
    expect(res.status).toBe(409);
  });

  it("supprime une campagne en brouillon", async () => {
    const res = await request(app).delete(`/api/campagnes/${brouillonId}`).set(auth(admin));
    expect(res.status).toBe(204);
  });
});
