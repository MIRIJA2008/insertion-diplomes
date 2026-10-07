-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "StatutCampagne" AS ENUM ('BROUILLON', 'OUVERTE', 'CLOTUREE');

-- CreateEnum
CREATE TYPE "Situation" AS ENUM ('EMPLOI_SALARIE', 'EMPLOI_INDEPENDANT', 'POURSUITE_ETUDES', 'RECHERCHE_EMPLOI', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('CDI', 'CDD', 'STAGE', 'INDEPENDANT', 'OCCASIONNEL');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONSULTANT',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filieres" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" SERIAL NOT NULL,
    "filiereId" INTEGER NOT NULL,
    "anneeSortie" INTEGER NOT NULL,
    "effectif" INTEGER,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diplomes" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "contact" TEXT,

    CONSTRAINT "diplomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campagnes" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "statut" "StatutCampagne" NOT NULL DEFAULT 'BROUILLON',

    CONSTRAINT "campagnes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" SERIAL NOT NULL,
    "campagneId" INTEGER NOT NULL,
    "diplomeId" INTEGER NOT NULL,
    "jeton" TEXT NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reponses" (
    "id" SERIAL NOT NULL,
    "invitationId" INTEGER NOT NULL,
    "situation" "Situation" NOT NULL,
    "secteur" TEXT,
    "typeContrat" "TypeContrat",
    "delaiInsertionMois" INTEGER,
    "ville" TEXT NOT NULL,
    "adequationFormation" INTEGER,
    "remarque" TEXT,
    "consentement" BOOLEAN NOT NULL,
    "soumiseLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reponses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "filieres_code_key" ON "filieres"("code");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_filiereId_anneeSortie_key" ON "promotions"("filiereId", "anneeSortie");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_jeton_key" ON "invitations"("jeton");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_campagneId_diplomeId_key" ON "invitations"("campagneId", "diplomeId");

-- CreateIndex
CREATE UNIQUE INDEX "reponses_invitationId_key" ON "reponses"("invitationId");

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomes" ADD CONSTRAINT "diplomes_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_campagneId_fkey" FOREIGN KEY ("campagneId") REFERENCES "campagnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_diplomeId_fkey" FOREIGN KEY ("diplomeId") REFERENCES "diplomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses" ADD CONSTRAINT "reponses_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
