# =============================================================
# REFONTE PLATEFORME INSERTION DIPLOMES - PARTIE BACKEND
# A executer dans PowerShell :  powershell -ExecutionPolicy Bypass -File .\refonte-backend.ps1
# Aucune fonctionnalite existante n'est supprimee : on AJOUTE des modules.
# =============================================================
$racine = "F:\insertion-diplomes"
$utf8 = [System.Text.UTF8Encoding]::new($false)

function Ecrire([string]$rel, [string]$contenu) {
  $chemin = Join-Path $racine $rel
  $dossier = Split-Path $chemin -Parent
  if (-not (Test-Path $dossier)) { New-Item -ItemType Directory -Force -Path $dossier | Out-Null }
  [System.IO.File]::WriteAllText($chemin, $contenu, $utf8)
  Write-Host "OK  $rel"
}

Write-Host "== 0. Sauvegarde Git ==" -ForegroundColor Cyan
Set-Location $racine
git add -A
git commit -m "sauvegarde avant refonte" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "(aucun changement a commiter, on continue)" }

# -------------------------------------------------------------
# 1. SCHEMA PRISMA (complete, conserve les modeles existants)
# -------------------------------------------------------------
Ecrire "backend\prisma\schema.prisma" @'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  CONSULTANT
  CANDIDAT
  RECRUTEUR
}

enum StatutCampagne {
  BROUILLON
  OUVERTE
  CLOTUREE
}

enum Situation {
  EMPLOI_SALARIE
  EMPLOI_INDEPENDANT
  POURSUITE_ETUDES
  RECHERCHE_EMPLOI
  AUTRE
}

enum TypeContrat {
  CDI
  CDD
  STAGE
  INDEPENDANT
  OCCASIONNEL
}

enum StatutCandidature {
  ENVOYEE
  VUE
  ACCEPTEE
  REFUSEE
}

enum TypeOrganisme {
  MINISTERE
  ADMINISTRATION
  ENTREPRISE_PRIVEE
  ONG
  AUTRE
}

enum TypeConversation {
  DIRECT
  GROUPE
}

model Utilisateur {
  id                 Int      @id @default(autoincrement())
  nom                String
  email              String   @unique
  motDePasseHash     String
  role               Role     @default(CONSULTANT)
  langue             String   @default("fr")
  couleurAccent      String   @default("bleu")
  creeLe             DateTime @default(now())

  profilCandidat     ProfilCandidat?
  organisme          Organisme?
  candidatures       Candidature[]
  favoris            Favori[]
  messages           Message[]
  messagesCommunaute MessageCommunaute[]
  notifications      Notification[]
  communautes        CommunauteMembre[]
  communautesCrees   Communaute[]
  conversations      ConversationMembre[]

  @@map("utilisateurs")
}

model ProfilCandidat {
  id            Int        @id @default(autoincrement())
  utilisateurId Int        @unique
  utilisateur   Utilisateur @relation(fields: [utilisateurId], references: [id], onDelete: Cascade)
  niveauEtudes  String?
  filiereId     Int?
  filiere       Filiere?   @relation(fields: [filiereId], references: [id], onDelete: SetNull)
  etablissement String?
  diplomes      String[]
  competences   String[]
  experience    String?
  cvPdf         Bytes?
  cvNom         String?
  photo         Bytes?
  majLe         DateTime   @updatedAt

  @@map("profils_candidats")
}

model Organisme {
  id            Int          @id @default(autoincrement())
  utilisateurId Int          @unique
  utilisateur   Utilisateur  @relation(fields: [utilisateurId], references: [id], onDelete: Cascade)
  nom           String
  type          TypeOrganisme @default(AUTRE)
  description   String?
  ville         String?
  verifie       Boolean      @default(false)
  offres        Offre[]

  @@map("organismes")
}

model Offre {
  id                     Int           @id @default(autoincrement())
  organismeId            Int
  organisme              Organisme     @relation(fields: [organismeId], references: [id], onDelete: Cascade)
  titre                  String
  description            String
  niveauRequis           String?
  filiereId              Int?
  filiere                Filiere?      @relation(fields: [filiereId], references: [id], onDelete: SetNull)
  competencesRecherchees String[]
  profilRecherche        String?
  lieu                   String
  typeContrat            TypeContrat?
  dateLimite             DateTime
  creeLe                 DateTime      @default(now())
  candidatures           Candidature[]
  favoris                Favori[]

  @@map("offres")
}

model Candidature {
  id         Int                @id @default(autoincrement())
  offreId    Int
  offre      Offre              @relation(fields: [offreId], references: [id], onDelete: Cascade)
  candidatId Int
  candidat   Utilisateur        @relation(fields: [candidatId], references: [id], onDelete: Cascade)
  lettre     String?
  statut     StatutCandidature  @default(ENVOYEE)
  dateEnvoi  DateTime           @default(now())

  @@unique([offreId, candidatId])
  @@map("candidatures")
}

model Favori {
  id            Int         @id @default(autoincrement())
  offreId       Int
  offre         Offre       @relation(fields: [offreId], references: [id], onDelete: Cascade)
  utilisateurId Int
  utilisateur   Utilisateur @relation(fields: [utilisateurId], references: [id], onDelete: Cascade)

  @@unique([offreId, utilisateurId])
  @@map("favoris")
}

model Communaute {
  id          Int                  @id @default(autoincrement())
  nom         String
  description String?
  domaine     String?
  filiereId   Int?
  filiere     Filiere?             @relation(fields: [filiereId], references: [id], onDelete: SetNull)
  creeParId   Int
  creePar     Utilisateur          @relation("CommunauteCreateur", fields: [creeParId], references: [id])
  creeLe      DateTime             @default(now())
  membres     CommunauteMembre[]
  messages    MessageCommunaute[]

  @@map("communautes")
}

model CommunauteMembre {
  communauteId Int
  communaute   Communaute  @relation(fields: [communauteId], references: [id], onDelete: Cascade)
  utilisateurId Int
  utilisateur  Utilisateur @relation(fields: [utilisateurId], references: [id], onDelete: Cascade)
  rejointLe   DateTime    @default(now())

  @@id([communauteId, utilisateurId])
  @@map("communaute_membres")
}

model MessageCommunaute {
  id           Int         @id @default(autoincrement())
  communauteId Int
  communaute   Communaute  @relation(fields: [communauteId], references: [id], onDelete: Cascade)
  auteurId     Int
  auteur       Utilisateur @relation(fields: [auteurId], references: [id], onDelete: Cascade)
  contenu      String
  envoyeLe     DateTime    @default(now())

  @@map("messages_communaute")
}

model Conversation {
  id       Int                 @id @default(autoincrement())
  type     TypeConversation    @default(DIRECT)
  creeLe   DateTime            @default(now())
  membres  ConversationMembre[]
  messages Message[]

  @@map("conversations")
}

model ConversationMembre {
  conversationId Int
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  utilisateurId  Int
  utilisateur    Utilisateur  @relation(fields: [utilisateurId], references: [id], onDelete: Cascade)

  @@id([conversationId, utilisateurId])
  @@map("conversation_membres")
}

model Message {
  id             Int          @id @default(autoincrement())
  conversationId Int
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  auteurId       Int
  auteur         Utilisateur  @relation(fields: [auteurId], references: [id], onDelete: Cascade)
  contenu        String
  envoyeLe       DateTime     @default(now())

  @@map("messages")
}

model Notification {
  id            Int         @id @default(autoincrement())
  utilisateurId Int
  utilisateur   Utilisateur @relation(fields: [utilisateurId], references: [id], onDelete: Cascade)
  titre         String
  contenu       String
  lue           Boolean     @default(false)
  creeLe        DateTime    @default(now())

  @@map("notifications")
}

model Filiere {
  id         Int         @id @default(autoincrement())
  code       String      @unique
  intitule   String
  niveau     String
  promotions Promotion[]
  profils    ProfilCandidat[]
  offres     Offre[]
  communautes Communaute[]

  @@map("filieres")
}

model Promotion {
  id          Int       @id @default(autoincrement())
  filiereId   Int
  filiere     Filiere   @relation(fields: [filiereId], references: [id], onDelete: Restrict)
  anneeSortie Int
  effectif    Int?
  diplomes    Diplome[]

  @@unique([filiereId, anneeSortie])
  @@map("promotions")
}

model Diplome {
  id          Int          @id @default(autoincrement())
  nom         String
  prenom      String
  promotionId Int
  promotion   Promotion    @relation(fields: [promotionId], references: [id], onDelete: Restrict)
  contact     String?
  invitations Invitation[]

  @@map("diplomes")
}

model Campagne {
  id          Int            @id @default(autoincrement())
  titre       String
  dateDebut   DateTime
  dateFin     DateTime
  statut      StatutCampagne @default(BROUILLON)
  invitations Invitation[]

  @@map("campagnes")
}

model Invitation {
  id         Int      @id @default(autoincrement())
  campagneId Int
  campagne   Campagne @relation(fields: [campagneId], references: [id], onDelete: Cascade)
  diplomeId  Int
  diplome    Diplome  @relation(fields: [diplomeId], references: [id], onDelete: Cascade)
  jeton      String   @unique
  reponse    Reponse?

  @@unique([campagneId, diplomeId])
  @@map("invitations")
}

model Reponse {
  id                  Int          @id @default(autoincrement())
  invitationId        Int          @unique
  invitation          Invitation   @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  situation           Situation
  secteur             String?
  typeContrat         TypeContrat?
  delaiInsertionMois  Int?
  ville               String
  adequationFormation Int?
  remarque            String?
  consentement        Boolean
  soumiseLe           DateTime     @default(now())

  @@map("reponses")
}
'@

# -------------------------------------------------------------
# 2. MODULE INSCRIPTION (candidat / recruteur)
# -------------------------------------------------------------
Ecrire "backend\src\modules\inscription\inscription.routes.ts" @'
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../utils/httpError";

const schema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  motDePasse: z.string().min(8),
  role: z.enum(["CANDIDAT", "RECRUTEUR"]),
  organisme: z
    .object({
      nom: z.string().min(2),
      type: z.enum(["MINISTERE", "ADMINISTRATION", "ENTREPRISE_PRIVEE", "ONG", "AUTRE"]).default("AUTRE"),
      ville: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

export const inscriptionRoutes = Router();

inscriptionRoutes.post("/", async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    if (data.role === "RECRUTEUR" && !data.organisme) {
      throw new HttpError(400, "Les informations de l'organisme sont obligatoires pour un compte recruteur");
    }
    const existe = await prisma.utilisateur.findUnique({ where: { email: data.email } });
    if (existe) throw new HttpError(409, "Cet e-mail est deja utilise");
    const motDePasseHash = await bcrypt.hash(data.motDePasse, 12);
    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom: data.nom,
        email: data.email,
        motDePasseHash,
        role: data.role,
        ...(data.role === "RECRUTEUR" && data.organisme
          ? { organisme: { create: { ...data.organisme } } }
          : { profilCandidat: { create: {} } }),
      },
      select: { id: true, nom: true, email: true, role: true },
    });
    res.status(201).json(utilisateur);
  } catch (e) {
    next(e);
  }
});
'@

# -------------------------------------------------------------
# 3. MODULE OFFRES (public liste/detail + CRUD recruteur)
# -------------------------------------------------------------
Ecrire "backend\src\modules\offres\offres.routes.ts" @'
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";

export type StatutOffre = "OUVERTE" | "EXPIRE_BIENTOT" | "CLOTUREE";

export function statutOffre(dateLimite: Date): StatutOffre {
  const maintenant = Date.now();
  const limite = new Date(dateLimite).getTime();
  if (limite < maintenant) return "CLOTUREE";
  if (limite < maintenant + 7 * 24 * 3600 * 1000) return "EXPIRE_BIENTOT";
  return "OUVERTE";
}

const offreInclude = {
  organisme: { select: { id: true, nom: true, type: true, ville: true, verifie: true } },
  filiere: { select: { id: true, code: true, intitule: true } },
  _count: { select: { candidatures: true } },
} as const;

function avecStatut(o: any) {
  const { _count, ...reste } = o;
  return { ...reste, nbCandidatures: _count?.candidatures ?? 0, statut: statutOffre(o.dateLimite) };
}

const offreSchema = z.object({
  titre: z.string().min(3),
  description: z.string().min(10),
  niveauRequis: z.string().optional(),
  filiereId: z.number().int().optional(),
  competencesRecherchees: z.array(z.string()).default([]),
  profilRecherche: z.string().optional(),
  lieu: z.string().min(2),
  typeContrat: z.enum(["CDI", "CDD", "STAGE", "INDEPENDANT", "OCCASIONNEL"]).optional(),
  dateLimite: z.coerce.date(),
});

export const offresRoutes = Router();

// Liste publique avec filtres (les offres cloturees sont masquees par defaut)
offresRoutes.get("/", async (req, res, next) => {
  try {
    const { q, ville, typeContrat, filiereId, organismeId, toutes } = req.query as Record<string, string>;
    const offres = await prisma.offre.findMany({
      where: {
        ...(q
          ? { OR: [{ titre: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }
          : {}),
        ...(ville ? { lieu: { contains: ville, mode: "insensitive" } } : {}),
        ...(typeContrat ? { typeContrat: typeContrat as any } : {}),
        ...(filiereId ? { filiereId: Number(filiereId) } : {}),
        ...(organismeId ? { organismeId: Number(organismeId) } : {}),
      },
      include: offreInclude,
      orderBy: { creeLe: "desc" },
    });
    const resultat = offres.map(avecStatut).filter((o) => toutes === "1" || o.statut !== "CLOTUREE");
    res.json(resultat);
  } catch (e) {
    next(e);
  }
});

// Recommandations selon le profil du candidat connecte
offresRoutes.get("/recommandees", authenticate, async (req, res, next) => {
  try {
    const profil = await prisma.profilCandidat.findUnique({ where: { utilisateurId: req.user!.id } });
    const offres = await prisma.offre.findMany({
      where: { dateLimite: { gte: new Date() } },
      include: offreInclude,
      orderBy: { creeLe: "desc" },
      take: 50,
    });
    const competences = (profil?.competences ?? []).map((c) => c.toLowerCase());
    const filiereId = profil?.filiereId;
    const niveau = profil?.niveauEtudes?.toLowerCase() ?? "";
    const note = (o: any) => {
      let score = 0;
      if (niveau && o.niveauRequis && o.niveauRequis.toLowerCase().includes(niveau)) score += 3;
      if (filiereId && o.filiereId === filiereId) score += 4;
      const recherchees = (o.competencesRecherchees ?? []).map((c: string) => c.toLowerCase());
      score += competences.filter((c) => recherchees.some((r: string) => r.includes(c) || c.includes(r))).length * 2;
      return score;
    };
    const resultat = offres
      .map((o) => ({ ...avecStatut(o), score: note(o) }))
      .filter((o) => o.score > 0)
      .sort((a, b) => b.score - a.score);
    res.json(resultat);
  } catch (e) {
    next(e);
  }
});

// Mes offres (recruteur) - declare AVANT /:id
offresRoutes.get("/recruteur/mes-offres", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const organisme = await prisma.organisme.findUnique({ where: { utilisateurId: req.user!.id } });
    if (!organisme) return res.json([]);
    const offres = await prisma.offre.findMany({
      where: { organismeId: organisme.id },
      include: offreInclude,
      orderBy: { creeLe: "desc" },
    });
    res.json(offres.map(avecStatut));
  } catch (e) {
    next(e);
  }
});

// Detail public
offresRoutes.get("/:id", async (req, res, next) => {
  try {
    const offre = await prisma.offre.findUnique({ where: { id: Number(req.params.id) }, include: offreInclude });
    if (!offre) throw new HttpError(404, "Offre introuvable");
    res.json(avecStatut(offre));
  } catch (e) {
    next(e);
  }
});

// Creation (recruteur)
offresRoutes.post("/", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const data = offreSchema.parse(req.body);
    if (data.dateLimite.getTime() < Date.now()) {
      throw new HttpError(400, "La date limite doit etre dans le futur");
    }
    const organisme = await prisma.organisme.findUnique({ where: { utilisateurId: req.user!.id } });
    if (!organisme) throw new HttpError(400, "Vous devez d'abord renseigner votre organisme");
    const offre = await prisma.offre.create({ data: { ...data, organismeId: organisme.id }, include: offreInclude });
    res.status(201).json(avecStatut(offre));
  } catch (e) {
    next(e);
  }
});

// Modification (recruteur proprietaire ou admin)
offresRoutes.put("/:id", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const data = offreSchema.partial().parse(req.body);
    const offre = await prisma.offre.findUnique({ where: { id: Number(req.params.id) }, include: { organisme: true } });
    if (!offre) throw new HttpError(404, "Offre introuvable");
    if (req.user!.role !== "ADMIN" && offre.organisme.utilisateurId !== req.user!.id) throw new HttpError(403, "Acces refuse");
    const maj = await prisma.offre.update({ where: { id: offre.id }, data, include: offreInclude });
    res.json(avecStatut(maj));
  } catch (e) {
    next(e);
  }
});

// Suppression (recruteur proprietaire ou admin)
offresRoutes.delete("/:id", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const offre = await prisma.offre.findUnique({ where: { id: Number(req.params.id) }, include: { organisme: true } });
    if (!offre) throw new HttpError(404, "Offre introuvable");
    if (req.user!.role !== "ADMIN" && offre.organisme.utilisateurId !== req.user!.id) throw new HttpError(403, "Acces refuse");
    await prisma.offre.delete({ where: { id: offre.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
'@

# -------------------------------------------------------------
# 4. MODULE CANDIDATURES + FAVORIS
# -------------------------------------------------------------
Ecrire "backend\src\modules\candidatures\candidatures.routes.ts" @'
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";
import { statutOffre } from "../offres/offres.routes";

export const candidaturesRoutes = Router();

// Postuler (candidat) - refuse si l'offre est cloturee
candidaturesRoutes.post("/offres/:id/postuler", authenticate, requireRole("CANDIDAT", "ADMIN"), async (req, res, next) => {
  try {
    const { lettre } = z.object({ lettre: z.string().max(2000).optional() }).parse(req.body ?? {});
    const offre = await prisma.offre.findUnique({ where: { id: Number(req.params.id) } });
    if (!offre) throw new HttpError(404, "Offre introuvable");
    if (statutOffre(offre.dateLimite) === "CLOTUREE") {
      throw new HttpError(400, "Cette offre est cloturee : la candidature est impossible");
    }
    const deja = await prisma.candidature.findUnique({
      where: { offreId_candidatId: { offreId: offre.id, candidatId: req.user!.id } },
    });
    if (deja) throw new HttpError(409, "Vous avez deja postule a cette offre");
    const candidature = await prisma.candidature.create({
      data: { offreId: offre.id, candidatId: req.user!.id, lettre },
    });
    const org = await prisma.organisme.findUnique({ where: { id: offre.organismeId } });
    if (org) {
      await prisma.notification.create({
        data: {
          utilisateurId: org.utilisateurId,
          titre: "Nouvelle candidature",
          contenu: `Nouvelle candidature pour l'offre "${offre.titre}".`,
        },
      });
    }
    res.status(201).json(candidature);
  } catch (e) {
    next(e);
  }
});

// Mes candidatures (candidat)
candidaturesRoutes.get("/mes-candidatures", authenticate, async (req, res, next) => {
  try {
    const liste = await prisma.candidature.findMany({
      where: { candidatId: req.user!.id },
      include: { offre: { include: { organisme: { select: { nom: true, type: true } } } } },
      orderBy: { dateEnvoi: "desc" },
    });
    res.json(liste);
  } catch (e) {
    next(e);
  }
});

// Candidatures recues (recruteur)
candidaturesRoutes.get("/recruteur/candidatures", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const organisme = await prisma.organisme.findUnique({ where: { utilisateurId: req.user!.id } });
    if (!organisme) return res.json([]);
    const liste = await prisma.candidature.findMany({
      where: { offre: { organismeId: organisme.id } },
      include: {
        offre: { select: { id: true, titre: true, dateLimite: true } },
        candidat: { select: { id: true, nom: true, email: true, profilCandidat: { include: { filiere: true } } } },
      },
      orderBy: { dateEnvoi: "desc" },
    });
    res.json(liste);
  } catch (e) {
    next(e);
  }
});

// Changer le statut d'une candidature (recruteur)
candidaturesRoutes.patch("/candidatures/:id/statut", authenticate, requireRole("RECRUTEUR", "ADMIN"), async (req, res, next) => {
  try {
    const { statut } = z.object({ statut: z.enum(["ENVOYEE", "VUE", "ACCEPTEE", "REFUSEE"]) }).parse(req.body);
    const c = await prisma.candidature.findUnique({
      where: { id: Number(req.params.id) },
      include: { offre: { include: { organisme: true } } },
    });
    if (!c) throw new HttpError(404, "Candidature introuvable");
    if (req.user!.role !== "ADMIN" && c.offre.organisme.utilisateurId !== req.user!.id) throw new HttpError(403, "Acces refuse");
    const maj = await prisma.candidature.update({ where: { id: c.id }, data: { statut } });
    await prisma.notification.create({
      data: {
        utilisateurId: c.candidatId,
        titre: "Candidature " + statut.toLowerCase(),
        contenu: `Votre candidature a l'offre "${c.offre.titre}" est passee au statut : ${statut}.`,
      },
    });
    res.json(maj);
  } catch (e) {
    next(e);
  }
});

// Ajouter / retirer un favori
candidaturesRoutes.put("/offres/:id/favori", authenticate, async (req, res, next) => {
  try {
    const offreId = Number(req.params.id);
    const existant = await prisma.favori.findUnique({
      where: { offreId_utilisateurId: { offreId, utilisateurId: req.user!.id } },
    });
    if (existant) {
      await prisma.favori.delete({ where: { id: existant.id } });
      return res.json({ favori: false });
    }
    await prisma.favori.create({ data: { offreId, utilisateurId: req.user!.id } });
    res.json({ favori: true });
  } catch (e) {
    next(e);
  }
});

// Mes favoris
candidaturesRoutes.get("/mes-favoris", authenticate, async (req, res, next) => {
  try {
    const liste = await prisma.favori.findMany({
      where: { utilisateurId: req.user!.id },
      include: { offre: { include: { organisme: { select: { nom: true } } } } },
    });
    res.json(liste);
  } catch (e) {
    next(e);
  }
});
'@

# -------------------------------------------------------------
# 5. MODULE PROFILS CANDIDATS
# -------------------------------------------------------------
Ecrire "backend\src\modules\profils\profils.routes.ts" @'
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";

export const profilsRoutes = Router();
profilsRoutes.use(authenticate);

const profilSchema = z.object({
  niveauEtudes: z.string().optional(),
  filiereId: z.number().int().nullable().optional(),
  etablissement: z.string().optional(),
  diplomes: z.array(z.string()).optional(),
  competences: z.array(z.string()).optional(),
  experience: z.string().optional(),
});

// Compte + profil complet
profilsRoutes.get("/moi", async (req, res, next) => {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: req.user!.id },
      select: { id: true, nom: true, email: true, role: true, langue: true, couleurAccent: true },
    });
    if (!utilisateur) throw new HttpError(404, "Utilisateur introuvable");
    const profil = await prisma.profilCandidat.findUnique({
      where: { utilisateurId: req.user!.id },
      include: { filiere: true },
    });
    res.json({ utilisateur, profil, cvNom: profil?.cvNom ?? null });
  } catch (e) {
    next(e);
  }
});

// Mise a jour du profil candidat
profilsRoutes.put("/moi", async (req, res, next) => {
  try {
    if (req.user!.role !== "CANDIDAT" && req.user!.role !== "ADMIN") {
      throw new HttpError(403, "Reserve aux candidats");
    }
    const data = profilSchema.parse(req.body);
    await prisma.profilCandidat.upsert({
      where: { utilisateurId: req.user!.id },
      create: { utilisateurId: req.user!.id },
      update: {},
    });
    const maj = await prisma.profilCandidat.update({
      where: { utilisateurId: req.user!.id },
      data: {
        ...(data.niveauEtudes !== undefined ? { niveauEtudes: data.niveauEtudes || null } : {}),
        ...(data.filiereId !== undefined ? { filiereId: data.filiereId } : {}),
        ...(data.etablissement !== undefined ? { etablissement: data.etablissement || null } : {}),
        ...(data.diplomes !== undefined ? { diplomes: data.diplomes } : {}),
        ...(data.competences !== undefined ? { competences: data.competences } : {}),
        ...(data.experience !== undefined ? { experience: data.experience || null } : {}),
      },
      include: { filiere: true },
    });
    res.json(maj);
  } catch (e) {
    next(e);
  }
});

// Preferences : langue + couleur d'accent
profilsRoutes.put("/moi/preferences", async (req, res, next) => {
  try {
    const { langue, couleurAccent } = z
      .object({
        langue: z.enum(["fr", "mg"]).optional(),
        couleurAccent: z.enum(["bleu", "vert", "rouge", "violet", "orange", "rose"]).optional(),
      })
      .parse(req.body);
    const maj = await prisma.utilisateur.update({
      where: { id: req.user!.id },
      data: { ...(langue ? { langue } : {}), ...(couleurAccent ? { couleurAccent } : {}) },
      select: { id: true, langue: true, couleurAccent: true },
    });
    res.json(maj);
  } catch (e) {
    next(e);
  }
});

// Televersement du CV (PDF en base64 dans le JSON)
profilsRoutes.post("/moi/cv", async (req, res, next) => {
  try {
    const { nom, contenu } = z
      .object({ nom: z.string().min(1), contenu: z.string().startsWith("data:application/pdf") })
      .parse(req.body);
    const base64 = contenu.split(",")[1] ?? "";
    await prisma.profilCandidat.upsert({
      where: { utilisateurId: req.user!.id },
      create: { utilisateurId: req.user!.id },
      update: {},
    });
    await prisma.profilCandidat.update({
      where: { utilisateurId: req.user!.id },
      data: { cvPdf: Buffer.from(base64, "base64"), cvNom: nom },
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Consultation du CV
profilsRoutes.get("/moi/cv", async (req, res, next) => {
  try {
    const profil = await prisma.profilCandidat.findUnique({ where: { utilisateurId: req.user!.id } });
    if (!profil?.cvPdf) throw new HttpError(404, "Aucun CV televerse");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${profil.cvNom ?? "cv.pdf"}"`);
    res.send(profil.cvPdf);
  } catch (e) {
    next(e);
  }
});
'@

# -------------------------------------------------------------
# 6. MODULE RECRUTEURS (organisme)
# -------------------------------------------------------------
Ecrire "backend\src\modules\recruteurs\recruteurs.routes.ts" @'
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate, requireRole } from "../../middlewares/authenticate";

export const recruteursRoutes = Router();
recruteursRoutes.use(authenticate, requireRole("RECRUTEUR", "ADMIN"));

const organismeSchema = z.object({
  nom: z.string().min(2),
  type: z.enum(["MINISTERE", "ADMINISTRATION", "ENTREPRISE_PRIVEE", "ONG", "AUTRE"]),
  ville: z.string().optional(),
  description: z.string().optional(),
});

recruteursRoutes.get("/moi/organisme", async (req, res, next) => {
  try {
    const organisme = await prisma.organisme.findUnique({
      where: { utilisateurId: req.user!.id },
      include: { _count: { select: { offres: true } } },
    });
    res.json(organisme);
  } catch (e) {
    next(e);
  }
});

recruteursRoutes.put("/moi/organisme", async (req, res, next) => {
  try {
    const data = organismeSchema.parse(req.body);
    const organisme = await prisma.organisme.upsert({
      where: { utilisateurId: req.user!.id },
      create: { utilisateurId: req.user!.id, ...data },
      update: data,
    });
    res.json(organisme);
  } catch (e) {
    next(e);
  }
});
'@

# -------------------------------------------------------------
# 7. MODULE PUBLIC (stats accueil + dernieres offres)
# -------------------------------------------------------------
Ecrire "backend\src\modules\public\public.routes.ts" @'
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { statutOffre } from "../offres/offres.routes";

export const publicRoutes = Router();

publicRoutes.get("/accueil", async (_req, res, next) => {
  try {
    const [diplomes, offres, organismes, filieres, candidats, reponsesEnquete] = await Promise.all([
      prisma.diplome.count(),
      prisma.offre.count({ where: { dateLimite: { gte: new Date() } } }),
      prisma.organisme.count({ where: { verifie: true } }),
      prisma.filiere.count(),
      prisma.utilisateur.count({ where: { role: "CANDIDAT" } }),
      prisma.reponse.count(),
    ]);
    const dernieresOffres = await prisma.offre.findMany({
      where: { dateLimite: { gte: new Date() } },
      include: { organisme: { select: { nom: true, type: true, ville: true } }, filiere: { select: { code: true } } },
      orderBy: { creeLe: "desc" },
      take: 6,
    });
    res.json({
      stats: { diplomes, offres, organismes, filieres, candidats, reponsesEnquete },
      categories: ["MINISTERE", "ADMINISTRATION", "ENTREPRISE_PRIVEE", "ONG", "AUTRE"],
      dernieresOffres: dernieresOffres.map((o) => ({ ...o, statut: statutOffre(o.dateLimite) })),
    });
  } catch (e) {
    next(e);
  }
});
'@

# -------------------------------------------------------------
# 8. MODULE NOTIFICATIONS
# -------------------------------------------------------------
Ecrire "backend\src\modules\notifications\notifications.routes.ts" @'
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middlewares/authenticate";

export const notificationsRoutes = Router();
notificationsRoutes.use(authenticate);

notificationsRoutes.get("/", async (req, res, next) => {
  try {
    const liste = await prisma.notification.findMany({
      where: { utilisateurId: req.user!.id },
      orderBy: { creeLe: "desc" },
      take: 30,
    });
    res.json(liste);
  } catch (e) {
    next(e);
  }
});

notificationsRoutes.patch("/tout-lire", async (req, res, next) => {
  try {
    const maj = await prisma.notification.updateMany({
      where: { utilisateurId: req.user!.id, lue: false },
      data: { lue: true },
    });
    res.json({ maj: maj.count });
  } catch (e) {
    next(e);
  }
});

notificationsRoutes.patch("/:id/lue", async (req, res, next) => {
  try {
    const maj = await prisma.notification.updateMany({
      where: { id: Number(req.params.id), utilisateurId: req.user!.id },
      data: { lue: true },
    });
    res.json({ maj: maj.count });
  } catch (e) {
    next(e);
  }
});
'@

# -------------------------------------------------------------
# 9. MODULE COMMUNAUTES
# -------------------------------------------------------------
Ecrire "backend\src\modules\communautes\communautes.routes.ts" @'
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";

export const communautesRoutes = Router();

communautesRoutes.get("/", authenticate, async (_req, res, next) => {
  try {
    const liste = await prisma.communaute.findMany({
      include: { filiere: { select: { code: true } }, _count: { select: { membres: true } } },
      orderBy: { creeLe: "desc" },
    });
    res.json(liste);
  } catch (e) {
    next(e);
  }
});

communautesRoutes.post("/", authenticate, async (req, res, next) => {
  try {
    const data = z
      .object({
        nom: z.string().min(3),
        description: z.string().optional(),
        domaine: z.string().optional(),
        filiereId: z.number().int().optional(),
      })
      .parse(req.body);
    const communaute = await prisma.communaute.create({
      data: { ...data, creeParId: req.user!.id, membres: { create: { utilisateurId: req.user!.id } } },
    });
    res.status(201).json(communaute);
  } catch (e) {
    next(e);
  }
});

communautesRoutes.post("/:id/rejoindre", authenticate, async (req, res, next) => {
  try {
    await prisma.communauteMembre.upsert({
      where: { communauteId_utilisateurId: { communauteId: Number(req.params.id), utilisateurId: req.user!.id } },
      create: { communauteId: Number(req.params.id), utilisateurId: req.user!.id },
      update: {},
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

communautesRoutes.delete("/:id/quitter", authenticate, async (req, res, next) => {
  try {
    await prisma.communauteMembre.deleteMany({
      where: { communauteId: Number(req.params.id), utilisateurId: req.user!.id },
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

communautesRoutes.get("/:id", authenticate, async (req, res, next) => {
  try {
    const communaute = await prisma.communaute.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        filiere: true,
        membres: { include: { utilisateur: { select: { id: true, nom: true } } }, take: 50 },
        messages: {
          include: { auteur: { select: { id: true, nom: true } } },
          orderBy: { envoyeLe: "asc" },
          take: 100,
        },
        _count: { select: { membres: true } },
      },
    });
    if (!communaute) throw new HttpError(404, "Communaute introuvable");
    res.json(communaute);
  } catch (e) {
    next(e);
  }
});

communautesRoutes.post("/:id/messages", authenticate, async (req, res, next) => {
  try {
    const membre = await prisma.communauteMembre.findUnique({
      where: { communauteId_utilisateurId: { communauteId: Number(req.params.id), utilisateurId: req.user!.id } },
    });
    if (!membre) throw new HttpError(403, "Rejoignez d'abord cette communaute");
    const { contenu } = z.object({ contenu: z.string().min(1).max(2000) }).parse(req.body);
    const message = await prisma.messageCommunaute.create({
      data: { communauteId: Number(req.params.id), auteurId: req.user!.id, contenu },
      include: { auteur: { select: { id: true, nom: true } } },
    });
    res.status(201).json(message);
  } catch (e) {
    next(e);
  }
});
'@

# -------------------------------------------------------------
# 10. MODULE MESSAGERIE PRIVEE
# -------------------------------------------------------------
Ecrire "backend\src\modules\messagerie\messagerie.routes.ts" @'
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middlewares/authenticate";
import { HttpError } from "../../utils/httpError";

export const messagerieRoutes = Router();
messagerieRoutes.use(authenticate);

messagerieRoutes.get("/conversations", async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { membres: { some: { utilisateurId: req.user!.id } } },
      include: {
        membres: { include: { utilisateur: { select: { id: true, nom: true, role: true } } } },
        messages: { orderBy: { envoyeLe: "desc" }, take: 1 },
      },
      orderBy: { id: "desc" },
    });
    res.json(conversations);
  } catch (e) {
    next(e);
  }
});

messagerieRoutes.post("/conversations", async (req, res, next) => {
  try {
    const { utilisateurId } = z.object({ utilisateurId: z.number().int() }).parse(req.body);
    if (utilisateurId === req.user!.id) throw new HttpError(400, "Vous ne pouvez pas ecrire a vous-meme");
    const autre = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!autre) throw new HttpError(404, "Utilisateur introuvable");
    const existante = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [{ membres: { some: { utilisateurId: req.user!.id } } }, { membres: { some: { utilisateurId } } }],
      },
    });
    if (existante) return res.json(existante);
    const conversation = await prisma.conversation.create({
      data: { type: "DIRECT", membres: { create: [{ utilisateurId: req.user!.id }, { utilisateurId }] } },
    });
    res.status(201).json(conversation);
  } catch (e) {
    next(e);
  }
});

messagerieRoutes.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const membre = await prisma.conversationMembre.findUnique({
      where: { conversationId_utilisateurId: { conversationId: Number(req.params.id), utilisateurId: req.user!.id } },
    });
    if (!membre) throw new HttpError(403, "Acces refuse");
    const messages = await prisma.message.findMany({
      where: { conversationId: Number(req.params.id) },
      include: { auteur: { select: { id: true, nom: true } } },
      orderBy: { envoyeLe: "asc" },
      take: 200,
    });
    res.json(messages);
  } catch (e) {
    next(e);
  }
});

messagerieRoutes.post("/conversations/:id/messages", async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    const membre = await prisma.conversationMembre.findUnique({
      where: { conversationId_utilisateurId: { conversationId, utilisateurId: req.user!.id } },
    });
    if (!membre) throw new HttpError(403, "Acces refuse");
    const { contenu } = z.object({ contenu: z.string().min(1).max(2000) }).parse(req.body);
    const message = await prisma.message.create({
      data: { conversationId, auteurId: req.user!.id, contenu },
      include: { auteur: { select: { id: true, nom: true } } },
    });
    const autres = await prisma.conversationMembre.findMany({
      where: { conversationId, utilisateurId: { not: req.user!.id } },
    });
    if (autres.length > 0) {
      await prisma.notification.createMany({
        data: autres.map((m) => ({ utilisateurId: m.utilisateurId, titre: "Nouveau message", contenu: contenu.slice(0, 80) })),
      });
    }
    res.status(201).json(message);
  } catch (e) {
    next(e);
  }
});
'@

# -------------------------------------------------------------
# 11. app.ts mis a jour (conserve TOUTES les routes existantes)
# -------------------------------------------------------------
Ecrire "backend\src\app.ts" @'
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./config/prisma";
import authRoutes from "./modules/auth/auth.routes";
import filiereRoutes from "./modules/filieres/filieres.routes";
import promotionRoutes from "./modules/promotions/promotions.routes";
import diplomeRoutes from "./modules/diplomes/diplomes.routes";
import campagneRoutes from "./modules/campagnes/campagnes.routes";
import enqueteRoutes from "./modules/enquete/enquete.routes";
import statistiqueRoutes from "./modules/statistiques/statistiques.routes";
import { inscriptionRoutes } from "./modules/inscription/inscription.routes";
import { offresRoutes } from "./modules/offres/offres.routes";
import { candidaturesRoutes } from "./modules/candidatures/candidatures.routes";
import { profilsRoutes } from "./modules/profils/profils.routes";
import { recruteursRoutes } from "./modules/recruteurs/recruteurs.routes";
import { publicRoutes } from "./modules/public/public.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { communautesRoutes } from "./modules/communautes/communautes.routes";
import { messagerieRoutes } from "./modules/messagerie/messagerie.routes";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors());
// Limite relevee pour permettre l'envoi du CV en base64
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "error", db: "indisponible" });
  }
});

// Routes existantes (inchangees)
app.use("/api/auth", authRoutes);
app.use("/api/filieres", filiereRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/diplomes", diplomeRoutes);
app.use("/api/campagnes", campagneRoutes);
app.use("/api/enquete", enqueteRoutes);
app.use("/api/statistiques", statistiqueRoutes);

// Routes ajoutees par la refonte
app.use("/api/inscription", inscriptionRoutes);
app.use("/api/offres", offresRoutes);
app.use("/api", candidaturesRoutes);
app.use("/api/profils", profilsRoutes);
app.use("/api/recruteurs", recruteursRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/communautes", communautesRoutes);
app.use("/api/messagerie", messagerieRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

app.use(errorHandler);
'@

# -------------------------------------------------------------
# 12. Migration Prisma + verification
# -------------------------------------------------------------
Write-Host "`n== Migration de la base de donnees ==" -ForegroundColor Cyan
Set-Location "$racine\backend"
npx prisma migrate dev --name refonte_insertion
npx prisma generate

Write-Host "`n== Verification TypeScript ==" -ForegroundColor Cyan
npx tsc --noEmit

Write-Host "`nPARTIE BACKEND TERMINEE." -ForegroundColor Green
Write-Host "Pense a lancer le script refonte-frontend.ps1 ensuite."
