-- CreateTable
CREATE TABLE "candidature_historique" (
    "id" SERIAL NOT NULL,
    "candidatureId" INTEGER NOT NULL,
    "ancienStatut" "StatutCandidature",
    "nouveauStatut" "StatutCandidature" NOT NULL,
    "commentaire" TEXT,
    "auteurId" INTEGER NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidature_historique_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "candidature_historique" ADD CONSTRAINT "candidature_historique_candidatureId_fkey" FOREIGN KEY ("candidatureId") REFERENCES "candidatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidature_historique" ADD CONSTRAINT "candidature_historique_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
