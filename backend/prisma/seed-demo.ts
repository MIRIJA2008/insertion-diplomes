import { PrismaClient, Role, TypeOrganisme, TypeContrat, StatutCandidature } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FILIERES = ["Informatique", "Gestion", "Droit", "Médecine"];
const PRENOMS = ["Andry", "Soa", "Tojo", "Miora", "Faly", "Hery", "Tiana", "Lova", "Nirina", "Hasina"];
const NOMS = ["Rakoto", "Razafy", "Andria", "Randria", "Rakotomalala", "Rabe", "Andrianina", "Rasoanaivo"];
const VILLES = ["Antananarivo", "Toamasina", "Fianarantsoa", "Mahajanga", "Toliara"];
const SITUATIONS = ["INCONNU", "EN_RECHERCHE", "EN_STAGE", "EN_CDD", "EN_CDI", "INDEPENDANT", "EN_FORMATION"];

async function main() {
  console.log("🌱 Démarrage du seed massif...");

  // 1. Nettoyage des données de démo (pour éviter les doublons)
  await prisma.utilisateur.deleteMany({ where: { email: { contains: "@demo.mg" } } });
  await prisma.actualitePromotion.deleteMany();
  await prisma.organisme.deleteMany({ where: { nom: { contains: "Demo" } } });

  // 2. Création des filières si absentes
  const filieresDB = [];
  for (const f of FILIERES) {
    let fil = await prisma.filiere.findFirst({ where: { intitule: f } });
    if (!fil) {
      fil = await prisma.filiere.create({ data: { code: f.substring(0, 3).toUpperCase(), intitule: f, niveau: "Licence" } });
    }
    filieresDB.push(fil);
  }

  // 3. Création des promotions
  const promotions = [];
  for (const fil of filieresDB) {
    for (const annee of [2022, 2023, 2024, 2025]) {
      let promo = await prisma.promotion.findFirst({ where: { filiereId: fil.id, anneeSortie: annee } });
      if (!promo) {
        promo = await prisma.promotion.create({ data: { filiereId: fil.id, anneeSortie: annee } });
      }
      promotions.push(promo);
    }
  }

  // 4. Création des organismes
  const organismesDB = [];
  for (let i = 0; i < 15; i++) {
    const userOrg = await prisma.utilisateur.create({
      data: {
        nom: `Organisme Demo ${i}`,
        email: `org${i}@demo.mg`,
        motDePasseHash: await bcrypt.hash("Demo123!", 10),
        role: Role.RECRUTEUR,
      }
    });
    const org = await prisma.organisme.create({
      data: {
        utilisateurId: userOrg.id,
        nom: `Entreprise Demo ${i}`,
        type: i % 2 === 0 ? TypeOrganisme.ENTREPRISE_PRIVEE : TypeOrganisme.ONG,
        ville: VILLES[i % VILLES.length],
        verifie: i % 3 === 0,
      }
    });
    organismesDB.push(org);
  }

  // 5. Création des diplômés
  const hashedPassword = await bcrypt.hash("Demo123!", 10);
  for (let i = 0; i < 50; i++) {
    const prenom = PRENOMS[i % PRENOMS.length];
    const nom = NOMS[i % NOMS.length];
    const fil = filieresDB[i % filieresDB.length];
    const promo = promotions.find(p => p.filiereId === fil.id) || promotions[0];

    await prisma.utilisateur.create({
      data: {
        nom: `${prenom} ${nom}`,
        email: `diplome${i}@demo.mg`,
        motDePasseHash: hashedPassword,
        role: Role.CANDIDAT,
        profilCandidat: {
          create: {
            niveauEtudes: "Licence 3",
            filiereId: fil.id,
            etablissement: "INSI",
            diplomes: [`Licence ${fil.intitule}`],
            competences: ["Communication", "Travail en équipe", "Informatique"],
            situationPro: SITUATIONS[i % SITUATIONS.length],
            verifie: i % 4 === 0,
          }
        }
      }
    });
  }

  // 6. Création des offres
  for (let i = 0; i < 80; i++) {
    const org = organismesDB[i % organismesDB.length];
    const fil = filieresDB[i % filieresDB.length];
    await prisma.offre.create({
      data: {
        organismeId: org.id,
        titre: `Offre Demo ${i} - ${fil.intitule}`,
        description: "Description de l offre de démonstration.",
        filiereId: fil.id,
        lieu: VILLES[i % VILLES.length],
        typeContrat: TypeContrat.CDI,
        dateLimite: new Date(Date.now() + 30 * 86400000),
      }
    });
  }

  // 7. Création des actualités de promotion
  for (const promo of promotions) {
    await prisma.actualitePromotion.create({
      data: {
        promotionId: promo.id,
        titre: "Cérémonie de sortie",
        contenu: "La cérémonie de remise des diplômes aura lieu le mois prochain.",
        type: "EVENEMENT",
      }
    });
  }

  console.log("✅ Seed massif terminé avec succès !");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
