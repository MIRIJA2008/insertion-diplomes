-- CreateTable
CREATE TABLE "activite_logs" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activite_logs_pkey" PRIMARY KEY ("id")
);
