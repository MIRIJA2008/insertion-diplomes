import { PrismaClient, Role, TypeOrganisme, TypeContrat, StatutCandidature, TypeConversation } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Demo123!";
const DEMO_EMAILS = [
  "recruteur.ministere@demo.mg", "recruteur.entreprise@demo.mg", "recruteur.ong@demo.mg",
  "candidat.info@demo.mg", "candidat.gestion@demo.mg", "candidat.droit@demo.mg",
];
const FILIERES_DEMO = [
  { code: "INFO", intitule: "Informatique", niveau: "Licence" },
  { code: "GEST", intitule: "Gestion", niveau: "Licence" },
  { code: "DROIT", intitule: "Droit", niveau: "Licence" },
  { code: "MED", intitule: "Medecine", niveau: "Master" },
];
const jours = (n: number) => new Date(Date.now() + n * 86400000);

async function main() {
  console.log("Seed demarrage...");

  const filiereByCode: Record<string, any> = {};
  for (const f of await prisma.filiere.findMany()) filiereByCode[f.code] = f;
  for (const f of FILIERES_DEMO) {
    if (!filiereByCode[f.code]) {
      filiereByCode[f.code] = await prisma.filiere.create({ data: f });
    }
  }
  console.log("Filieres pretes :", Object.keys(filiereByCode).length);

  const demoUsers = await prisma.utilisateur.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true },
  });
  const demoIds = demoUsers.map(u => u.id);

  if (demoIds.length > 0) {
    const convs = await prisma.conversation.findMany({ include: { membres: true } });
    const convIds = convs
      .filter(c => c.membres.length > 0 && c.membres.every(m => demoIds.includes(m.utilisateurId)))
      .map(c => c.id);
    if (convIds.length > 0) {
      await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.conversationMembre.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
    }
    const commIds = (await prisma.communaute.findMany({
      where: { creeParId: { in: demoIds } },
      select: { id: true },
    })).map(c => c.id);
    if (commIds.length > 0) {
      await prisma.messageCommunaute.deleteMany({ where: { communauteId: { in: commIds } } });
      await prisma.communauteMembre.deleteMany({ where: { communauteId: { in: commIds } } });
      await prisma.communaute.deleteMany({ where: { id: { in: commIds } } });
    }
    await prisma.utilisateur.deleteMany({ where: { id: { in: demoIds } } });
    console.log("Anciens comptes demo supprimes :", demoIds.length);
  }

  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const recMin = await prisma.utilisateur.create({ data: { nom: "Rakoto Ministere", email: "recruteur.ministere@demo.mg", motDePasseHash: hash, role: Role.RECRUTEUR } });
  const recEnt = await prisma.utilisateur.create({ data: { nom: "Rasoa Entreprise", email: "recruteur.entreprise@demo.mg", motDePasseHash: hash, role: Role.RECRUTEUR } });
  const recOng = await prisma.utilisateur.create({ data: { nom: "Randria ONG", email: "recruteur.ong@demo.mg", motDePasseHash: hash, role: Role.RECRUTEUR } });

  const cand1 = await prisma.utilisateur.create({
    data: { nom: "Andry Rakoto", email: "candidat.info@demo.mg", motDePasseHash: hash, role: Role.CANDIDAT,
      profilCandidat: { create: { niveauEtudes: "Licence 3", filiereId: filiereByCode["INFO"]?.id, etablissement: "INSI",
        diplomes: ["Licence Informatique - INSI 2025"], competences: ["React","Node.js","TypeScript","PostgreSQL","Git"],
        experience: "2 stages en developpement web" } } },
  });
  const cand2 = await prisma.utilisateur.create({
    data: { nom: "Soa Razafy", email: "candidat.gestion@demo.mg", motDePasseHash: hash, role: Role.CANDIDAT,
      profilCandidat: { create: { niveauEtudes: "Master 1", filiereId: filiereByCode["GEST"]?.id, etablissement: "Universite Antananarivo",
        diplomes: ["Licence Gestion","Master 1 Management"], competences: ["Comptabilite","Excel","SAP","Analyse financiere"],
        experience: "1 an assistante comptable" } } },
  });
  const cand3 = await prisma.utilisateur.create({
    data: { nom: "Tojo Andria", email: "candidat.droit@demo.mg", motDePasseHash: hash, role: Role.CANDIDAT,
      profilCandidat: { create: { niveauEtudes: "Master 2", filiereId: filiereByCode["DROIT"]?.id, etablissement: "Universite Fianarantsoa",
        diplomes: ["Master 2 Droit des Affaires"], competences: ["Droit des societes","Contrats","Contentieux","Redaction juridique"],
        experience: "2 stages en cabinet d avocats" } } },
  });
  console.log("6 utilisateurs crees (mdp :", DEMO_PASSWORD + ")");

  const orgMin = await prisma.organisme.create({ data: { utilisateurId: recMin.id, nom: "Ministere de l Insertion", type: TypeOrganisme.MINISTERE, description: "Organisme public charge de l insertion", ville: "Antananarivo", verifie: true } });
  const orgEnt = await prisma.organisme.create({ data: { utilisateurId: recEnt.id, nom: "TechMada SARL", type: TypeOrganisme.ENTREPRISE_PRIVEE, description: "Entreprise de developpement logiciel", ville: "Antananarivo", verifie: true } });
  const orgOng = await prisma.organisme.create({ data: { utilisateurId: recOng.id, nom: "ONG Espoir Madagascar", type: TypeOrganisme.ONG, description: "ONG education et insertion des jeunes", ville: "Toamasina", verifie: false } });
  console.log("3 organismes crees");

  const offresData = [
    { organismeId: orgEnt.id, titre: "Developpeur Full Stack React / Node.js",
      description: "Nous recherchons un developpeur passionne.\n\nMissions :\n- Interfaces React modernes\n- API Node.js\n- Revues de code\n\nStack : TypeScript, PostgreSQL, Docker, Git",
      niveauRequis: "Licence 3 minimum en Informatique", filiereId: filiereByCode["INFO"]?.id,
      competencesRecherchees: ["React","Node.js","TypeScript","PostgreSQL"],
      profilRecherche: "Developpeur curieux et autonome.",
      lieu: "Antananarivo", typeContrat: TypeContrat.CDI, dateLimite: jours(30) },
    { organismeId: orgEnt.id, titre: "Data Analyst Junior",
      description: "Rejoignez notre equipe data.\n\nMissions :\n- Dashboards\n- Preparation des donnees\n- Rapports d analyse\n\nOutils : SQL, Python, Power BI",
      niveauRequis: "Licence Informatique ou Statistiques", filiereId: filiereByCode["INFO"]?.id,
      competencesRecherchees: ["SQL","Python","Excel","Power BI"],
      profilRecherche: "Rigoureux et a l aise avec les chiffres.",
      lieu: "Antananarivo", typeContrat: TypeContrat.CDI, dateLimite: jours(45) },
    { organismeId: orgEnt.id, titre: "Ingenieur DevOps",
      description: "Responsable de notre infrastructure cloud.\n\nMissions :\n- Pipelines CI/CD\n- Kubernetes\n- Securite et disponibilite\n\nStack : AWS, Docker, Kubernetes, Terraform",
      niveauRequis: "Bac+4 minimum", filiereId: filiereByCode["INFO"]?.id,
      competencesRecherchees: ["Docker","Kubernetes","AWS","Linux","CI/CD"],
      profilRecherche: "Experience en production requise.",
      lieu: "Antananarivo", typeContrat: TypeContrat.CDI, dateLimite: jours(60) },
    { organismeId: orgEnt.id, titre: "Stage Developpeur Front-End",
      description: "Stage de 6 mois.\n\nMissions :\n- Integration maquettes\n- Composants React\n- Tests unitaires\n\nEncadrement senior.",
      niveauRequis: "Licence 2 ou 3 Informatique", filiereId: filiereByCode["INFO"]?.id,
      competencesRecherchees: ["HTML","CSS","JavaScript","React"],
      profilRecherche: "Etudiant motive.",
      lieu: "Antananarivo", typeContrat: TypeContrat.STAGE, dateLimite: jours(20) },
    { organismeId: orgMin.id, titre: "Charge de Mission Insertion",
      description: "Au sein du ministere.\n\nMissions :\n- Suivi des dispositifs\n- Rapports\n- Coordination partenaires",
      niveauRequis: "Master Gestion ou Sciences Politiques", filiereId: filiereByCode["GEST"]?.id,
      competencesRecherchees: ["Gestion de projet","Redaction","Analyse"],
      profilRecherche: "Sens du service public.",
      lieu: "Antananarivo", typeContrat: TypeContrat.CDD, dateLimite: jours(25) },
    { organismeId: orgMin.id, titre: "Assistant Comptable",
      description: "Direction financiere.\n\nMissions :\n- Saisie comptable\n- Rapprochements bancaires\n- Declarations fiscales",
      niveauRequis: "Licence Comptabilite / Gestion", filiereId: filiereByCode["GEST"]?.id,
      competencesRecherchees: ["Comptabilite","Excel","Sage"],
      profilRecherche: "Rigueur et organisation.",
      lieu: "Antananarivo", typeContrat: TypeContrat.CDI, dateLimite: jours(15) },
    { organismeId: orgMin.id, titre: "Juriste d entreprise",
      description: "Securite juridique.\n\nMissions :\n- Contrats\n- Veille juridique\n- Contentieux",
      niveauRequis: "Master 2 Droit des Affaires", filiereId: filiereByCode["DROIT"]?.id,
      competencesRecherchees: ["Droit des societes","Contrats","Contentieux"],
      profilRecherche: "Excellente redaction.",
      lieu: "Antananarivo", typeContrat: TypeContrat.CDI, dateLimite: jours(40) },
    { organismeId: orgOng.id, titre: "Charge de Projet Education",
      description: "Coordination projets educatifs region Est.\n\nMissions :\n- Projets terrain\n- Reporting bailleurs\n- Ateliers",
      niveauRequis: "Master Sciences Sociales ou Gestion", filiereId: filiereByCode["GEST"]?.id,
      competencesRecherchees: ["Gestion de projet","Reporting","Animation"],
      profilRecherche: "Experience ONG appreciee.",
      lieu: "Toamasina", typeContrat: TypeContrat.CDD, dateLimite: jours(35) },
    { organismeId: orgOng.id, titre: "Consultant Formateur",
      description: "Missions ponctuelles.\n\nMissions :\n- Formations\n- Evaluations\n- Retours d experience",
      niveauRequis: "Bac+3 minimum", filiereId: filiereByCode["GEST"]?.id,
      competencesRecherchees: ["Formation","Pedagogie","Communication"],
      profilRecherche: "A l aise en public.",
      lieu: "Toamasina", typeContrat: TypeContrat.INDEPENDANT, dateLimite: jours(50) },
    { organismeId: orgEnt.id, titre: "Consultant RH (CLOTUREE)",
      description: "Cette offre est terminee pour tester l affichage du statut CLOTUREE dans OffreDetail.",
      niveauRequis: "Master RH", filiereId: filiereByCode["GEST"]?.id,
      competencesRecherchees: ["Recrutement","SIRH"],
      profilRecherche: "Experience confirmee.",
      lieu: "Antananarivo", typeContrat: TypeContrat.CDI, dateLimite: jours(-10) },
  ];
  const offres = [];
  for (const data of offresData) offres.push(await prisma.offre.create({ data }));
  console.log(offres.length + " offres creees (dont 1 cloturee)");

  const candidaturesData = [
    { offreId: offres[0].id, candidatId: cand1.id, lettre: "Tres motive par ce poste...", statut: StatutCandidature.ACCEPTEE },
    { offreId: offres[1].id, candidatId: cand1.id, lettre: "Passionne par la data...", statut: StatutCandidature.VUE },
    { offreId: offres[2].id, candidatId: cand1.id, lettre: "Experience DevOps...", statut: StatutCandidature.ENVOYEE },
    { offreId: offres[5].id, candidatId: cand2.id, lettre: "Assistante comptable 1 an...", statut: StatutCandidature.VUE },
    { offreId: offres[4].id, candidatId: cand2.id, lettre: "Tres interessee...", statut: StatutCandidature.ENVOYEE },
    { offreId: offres[6].id, candidatId: cand3.id, lettre: "Juriste passionne...", statut: StatutCandidature.REFUSEE },
    { offreId: offres[7].id, candidatId: cand2.id, lettre: "Gestion de projet...", statut: StatutCandidature.ENVOYEE },
  ];
  for (const c of candidaturesData) await prisma.candidature.create({ data: c });
  console.log(candidaturesData.length + " candidatures creees");

  await prisma.favori.createMany({
    data: [
      { offreId: offres[2].id, utilisateurId: cand1.id },
      { offreId: offres[0].id, utilisateurId: cand2.id },
      { offreId: offres[6].id, utilisateurId: cand3.id },
    ],
  });
  console.log("3 favoris crees");

  const comm1 = await prisma.communaute.create({ data: { nom: "Developpeurs Madagascar", description: "Entraide, projets, opportunites.", domaine: "Informatique", filiereId: filiereByCode["INFO"]?.id, creeParId: cand1.id } });
  const comm2 = await prisma.communaute.create({ data: { nom: "Entrepreneurs et Gestion", description: "Partage d experiences.", domaine: "Gestion", filiereId: filiereByCode["GEST"]?.id, creeParId: cand2.id } });
  const comm3 = await prisma.communaute.create({ data: { nom: "Juristes Malgaches", description: "Reseau des juristes.", domaine: "Droit", filiereId: filiereByCode["DROIT"]?.id, creeParId: cand3.id } });

  await prisma.communauteMembre.createMany({ data: [
    { communauteId: comm1.id, utilisateurId: cand1.id },
    { communauteId: comm1.id, utilisateurId: recEnt.id },
    { communauteId: comm2.id, utilisateurId: cand2.id },
    { communauteId: comm2.id, utilisateurId: cand1.id },
    { communauteId: comm3.id, utilisateurId: cand3.id },
  ]});

  await prisma.messageCommunaute.createMany({ data: [
    { communauteId: comm1.id, auteurId: cand1.id, contenu: "Salut a tous ! Des retours sur TechMada ?" },
    { communauteId: comm1.id, auteurId: recEnt.id, contenu: "Bonjour, oui on recrute, postulez !" },
    { communauteId: comm1.id, auteurId: cand1.id, contenu: "Super, je viens de postuler pour Full Stack." },
    { communauteId: comm2.id, auteurId: cand2.id, contenu: "Bienvenue aux nouveaux membres !" },
    { communauteId: comm2.id, auteurId: cand1.id, contenu: "Merci Soa, ravi d etre la." },
    { communauteId: comm3.id, auteurId: cand3.id, contenu: "Des conseils pour le concours de la magistrature ?" },
  ]});
  console.log("3 communautes + membres + messages crees");

  const conv1 = await prisma.conversation.create({
    data: { type: TypeConversation.DIRECT,
      membres: { create: [{ utilisateurId: cand1.id }, { utilisateurId: recEnt.id }] } },
  });
  await prisma.message.createMany({ data: [
    { conversationId: conv1.id, auteurId: cand1.id, contenu: "Bonjour, quand auront lieu les entretiens ?" },
    { conversationId: conv1.id, auteurId: recEnt.id, contenu: "Bonjour Andry, la semaine prochaine." },
    { conversationId: conv1.id, auteurId: cand1.id, contenu: "Parfait, merci !" },
  ]});
  console.log("1 conversation + 3 messages crees");

  await prisma.notification.createMany({ data: [
    { utilisateurId: cand1.id, titre: "Candidature acceptee", contenu: "Felicitations pour Developpeur Full Stack !", lue: false },
    { utilisateurId: cand1.id, titre: "Candidature vue", contenu: "Votre candidature a ete vue par TechMada.", lue: true },
    { utilisateurId: cand2.id, titre: "Nouvelle offre", contenu: "Une offre correspond a votre profil : Assistant Comptable.", lue: false },
    { utilisateurId: recEnt.id, titre: "Nouvelle candidature", contenu: "Andry Rakoto a postule a votre offre.", lue: false },
    { utilisateurId: cand3.id, titre: "Candidature refusee", contenu: "Votre candidature pour Juriste d entreprise.", lue: false },
  ]});
  console.log("5 notifications creees");

  console.log("\nSeed termine avec succes !");
  console.log("\nComptes de demo (mdp : " + DEMO_PASSWORD + ")");
  console.log("  Recruteurs : recruteur.ministere@demo.mg / recruteur.entreprise@demo.mg / recruteur.ong@demo.mg");
  console.log("  Candidats  : candidat.info@demo.mg / candidat.gestion@demo.mg / candidat.droit@demo.mg");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });