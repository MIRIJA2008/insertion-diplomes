-- CreateTable
CREATE TABLE "alertes_offres" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "filiereId" INTEGER,
    "typeContrat" "TypeContrat",
    "ville" TEXT,
    "motsCles" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertes_offres_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "alertes_offres" ADD CONSTRAINT "alertes_offres_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes_offres" ADD CONSTRAINT "alertes_offres_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
