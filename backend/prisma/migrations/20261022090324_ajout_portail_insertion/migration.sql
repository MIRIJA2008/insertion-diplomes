-- CreateEnum
CREATE TYPE "StatutCandidature" AS ENUM ('ENVOYEE', 'VUE', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "TypeOrganisme" AS ENUM ('MINISTERE', 'ADMINISTRATION', 'ENTREPRISE_PRIVEE', 'ONG', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeConversation" AS ENUM ('DIRECT', 'GROUPE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'CANDIDAT';
ALTER TYPE "Role" ADD VALUE 'RECRUTEUR';

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "couleurAccent" TEXT NOT NULL DEFAULT 'bleu',
ADD COLUMN     "langue" TEXT NOT NULL DEFAULT 'fr';

-- CreateTable
CREATE TABLE "profils_candidats" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "niveauEtudes" TEXT,
    "filiereId" INTEGER,
    "etablissement" TEXT,
    "diplomes" TEXT[],
    "competences" TEXT[],
    "experience" TEXT,
    "cvPdf" BYTEA,
    "cvNom" TEXT,
    "photo" BYTEA,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profils_candidats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organismes" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeOrganisme" NOT NULL DEFAULT 'AUTRE',
    "description" TEXT,
    "ville" TEXT,
    "verifie" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organismes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offres" (
    "id" SERIAL NOT NULL,
    "organismeId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "niveauRequis" TEXT,
    "filiereId" INTEGER,
    "competencesRecherchees" TEXT[],
    "profilRecherche" TEXT,
    "lieu" TEXT NOT NULL,
    "typeContrat" "TypeContrat",
    "dateLimite" TIMESTAMP(3) NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatures" (
    "id" SERIAL NOT NULL,
    "offreId" INTEGER NOT NULL,
    "candidatId" INTEGER NOT NULL,
    "lettre" TEXT,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'ENVOYEE',
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoris" (
    "id" SERIAL NOT NULL,
    "offreId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,

    CONSTRAINT "favoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communautes" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "domaine" TEXT,
    "filiereId" INTEGER,
    "creeParId" INTEGER NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communautes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communaute_membres" (
    "communauteId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "rejointLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communaute_membres_pkey" PRIMARY KEY ("communauteId","utilisateurId")
);

-- CreateTable
CREATE TABLE "messages_communaute" (
    "id" SERIAL NOT NULL,
    "communauteId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,
    "contenu" TEXT NOT NULL,
    "envoyeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_communaute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "type" "TypeConversation" NOT NULL DEFAULT 'DIRECT',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_membres" (
    "conversationId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,

    CONSTRAINT "conversation_membres_pkey" PRIMARY KEY ("conversationId","utilisateurId")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,
    "contenu" TEXT NOT NULL,
    "envoyeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profils_candidats_utilisateurId_key" ON "profils_candidats"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "organismes_utilisateurId_key" ON "organismes"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "candidatures_offreId_candidatId_key" ON "candidatures"("offreId", "candidatId");

-- CreateIndex
CREATE UNIQUE INDEX "favoris_offreId_utilisateurId_key" ON "favoris"("offreId", "utilisateurId");

-- AddForeignKey
ALTER TABLE "profils_candidats" ADD CONSTRAINT "profils_candidats_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils_candidats" ADD CONSTRAINT "profils_candidats_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organismes" ADD CONSTRAINT "organismes_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offres" ADD CONSTRAINT "offres_organismeId_fkey" FOREIGN KEY ("organismeId") REFERENCES "organismes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offres" ADD CONSTRAINT "offres_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "offres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "offres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communautes" ADD CONSTRAINT "communautes_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communautes" ADD CONSTRAINT "communautes_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communaute_membres" ADD CONSTRAINT "communaute_membres_communauteId_fkey" FOREIGN KEY ("communauteId") REFERENCES "communautes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communaute_membres" ADD CONSTRAINT "communaute_membres_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_communaute" ADD CONSTRAINT "messages_communaute_communauteId_fkey" FOREIGN KEY ("communauteId") REFERENCES "communautes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_communaute" ADD CONSTRAINT "messages_communaute_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_membres" ADD CONSTRAINT "conversation_membres_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_membres" ADD CONSTRAINT "conversation_membres_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
