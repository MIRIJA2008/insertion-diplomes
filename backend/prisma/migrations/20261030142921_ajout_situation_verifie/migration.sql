-- AlterTable
ALTER TABLE "profils_candidats" ADD COLUMN     "situationPro" TEXT DEFAULT 'INCONNU',
ADD COLUMN     "verifie" BOOLEAN NOT NULL DEFAULT false;
