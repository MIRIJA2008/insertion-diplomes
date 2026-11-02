import { PrismaClient, TypeContrat } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Création des offres de démonstration...");

  // 1. Récupérer tous les organismes existants
  const organismes = await prisma.organisme.findMany();
  if (organismes.length === 0) {
    console.log("❌ Aucun organisme trouvé. Impossible de créer des offres.");
    return;
  }

  // 2. Récupérer les filières
  const filieres = await prisma.filiere.findMany();

  // 3. Créer 80 offres
  for (let i = 0; i < 80; i++) {
    const org = organismes[i % organismes.length];
    const fil = filieres[i % filieres.length];

    await prisma.offre.create({
      data: {
        organismeId: org.id,
        titre: `Offre Demo ${i + 1} - ${fil ? fil.intitule : "Général"}`,
        description: "Description de l offre de démonstration pour remplir la base de données. Nous recherchons un profil motivé et compétent.",
        filiereId: fil?.id,
        lieu: ["Antananarivo", "Toamasina", "Fianarantsoa", "Mahajanga", "Toliara"][i % 5],
        typeContrat: [TypeContrat.CDI, TypeContrat.CDD, TypeContrat.STAGE, TypeContrat.INDEPENDANT][i % 4],
        dateLimite: new Date(Date.now() + 30 * 86400000), // Dans 30 jours
      }
    });
  }

  console.log("✅ 80 offres créées avec succès !");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
