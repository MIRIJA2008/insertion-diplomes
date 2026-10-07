import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma";

const schema = z.object({
  ADMIN_NOM: z.string().min(2),
  ADMIN_EMAIL: z.string().trim().email().toLowerCase(),
  ADMIN_PASSWORD: z.string().min(8),
});

async function main() {
  const d = schema.parse(process.env);
  const existant = await prisma.utilisateur.findUnique({ where: { email: d.ADMIN_EMAIL } });
  if (existant) {
    console.log("Un compte existe deja avec cet e-mail.");
    return;
  }
  const hash = await bcrypt.hash(d.ADMIN_PASSWORD, 12);
  await prisma.utilisateur.create({
    data: { nom: d.ADMIN_NOM, email: d.ADMIN_EMAIL, motDePasseHash: hash, role: "ADMIN" },
  });
  console.log("Administrateur cree :", d.ADMIN_EMAIL);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
