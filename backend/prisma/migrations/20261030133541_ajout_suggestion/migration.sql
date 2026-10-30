-- CreateTable
CREATE TABLE "suggestions" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "categorie" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'NOUVELLE',
    "reponse" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);
