-- CreateTable
CREATE TABLE "actualites_promotions" (
    "id" SERIAL NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actualites_promotions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "actualites_promotions" ADD CONSTRAINT "actualites_promotions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
