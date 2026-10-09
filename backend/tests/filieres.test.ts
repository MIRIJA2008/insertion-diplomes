import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

let adminToken = "";
let consultantToken = "";

async function login(email: string, motDePasse: string) {
  const res = await request(app).post("/api/auth/login").send({ email, motDePasse });
  return res.body.token as string;
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes("_test")) {
    throw new Error("Les tests doivent utiliser la base de test (nom avec _test).");
  }
  await prisma.reponse.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.diplome.deleteMany();
  await prisma.campagne.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.filiere.deleteMany();
  await prisma.utilisateur.deleteMany();

  const hash = await bcrypt.hash("MotDePasseTest1!", 4);
  await prisma.utilisateur.createMany({
    data: [
      { nom: "Admin Test", email: "admin@test.local", motDePasseHash: hash, role: "ADMIN" },
      { nom: "Consultant Test", email: "consultant@test.local", motDePasseHash: hash, role: "CONSULTANT" },
    ],
  });
  adminToken = await login("admin@test.local", "MotDePasseTest1!");
  consultantToken = await login("consultant@test.local", "MotDePasseTest1!");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Authentification", () => {
  it("refuse un mauvais mot de passe", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.local", motDePasse: "faux" });
    expect(res.status).toBe(401);
  });

  it("refuse l acces sans jeton", async () => {
    const res = await request(app).get("/api/filieres");
    expect(res.status).toBe(401);
  });

  it("ne renvoie jamais le hash du mot de passe", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.local", motDePasse: "MotDePasseTest1!" });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain("motDePasseHash");
  });
});

describe("Filieres", () => {
  let id = 0;

  it("l admin cree une filiere", async () => {
    const res = await request(app)
      .post("/api/filieres")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "dev", intitule: "Developpement logiciel", niveau: "BTS" });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe("DEV");
    id = res.body.id;
  });

  it("refuse un code deja utilise", async () => {
    const res = await request(app)
      .post("/api/filieres")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "DEV", intitule: "Autre", niveau: "BTS" });
    expect(res.status).toBe(409);
  });

  it("refuse des donnees invalides", async () => {
    const res = await request(app)
      .post("/api/filieres")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "", intitule: "x" });
    expect(res.status).toBe(400);
  });

  it("le consultant peut lire mais pas creer", async () => {
    const lecture = await request(app)
      .get("/api/filieres")
      .set("Authorization", `Bearer ${consultantToken}`);
    expect(lecture.status).toBe(200);
    expect(lecture.body).toHaveLength(1);

    const creation = await request(app)
      .post("/api/filieres")
      .set("Authorization", `Bearer ${consultantToken}`)
      .send({ code: "ELEC", intitule: "Electricite", niveau: "CAP" });
    expect(creation.status).toBe(403);
  });

  it("modifie une filiere", async () => {
    const res = await request(app)
      .put(`/api/filieres/${id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "DEV", intitule: "Developpement d applications", niveau: "BTS" });
    expect(res.status).toBe(200);
    expect(res.body.intitule).toBe("Developpement d applications");
  });

  it("retourne 404 pour une filiere inconnue", async () => {
    const res = await request(app)
      .get("/api/filieres/999999")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it("refuse de supprimer une filiere qui a des promotions (RG-07)", async () => {
    await prisma.promotion.create({ data: { filiereId: id, anneeSortie: 2025 } });
    const res = await request(app)
      .delete(`/api/filieres/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
    await prisma.promotion.deleteMany();
  });

  it("supprime une filiere sans promotion", async () => {
    const res = await request(app)
      .delete(`/api/filieres/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });
});
