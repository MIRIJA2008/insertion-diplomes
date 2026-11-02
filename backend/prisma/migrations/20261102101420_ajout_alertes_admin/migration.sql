-- CreateTable
CREATE TABLE "alertes_admin" (
    "id" SERIAL NOT NULL,
    "diplomeId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "priorite" TEXT NOT NULL DEFAULT 'MOYENNE',
    "statut" TEXT NOT NULL DEFAULT 'NOUVELLE',
    "commentaire" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alertes_admin_pkey" PRIMARY KEY ("id")
);
