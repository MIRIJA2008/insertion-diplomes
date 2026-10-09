import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";

const MOT_DE_PASSE = "MotDePasseTest1!";

export async function setupTestDb() {
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

  const hash = await bcrypt.hash(MOT_DE_PASSE, 4);
  await prisma.utilisateur.createMany({
    data: [
      { nom: "Admin Test", email: "admin@test.local", motDePasseHash: hash, role: "ADMIN" },
      { nom: "Consultant Test", email: "consultant@test.local", motDePasseHash: hash, role: "CONSULTANT" },
    ],
  });

  const login = async (email: string) => {
    const res = await request(app).post("/api/auth/login").send({ email, motDePasse: MOT_DE_PASSE });
    return res.body.token as string;
  };
  return {
    adminToken: await login("admin@test.local"),
    consultantToken: await login("consultant@test.local"),
  };
}
