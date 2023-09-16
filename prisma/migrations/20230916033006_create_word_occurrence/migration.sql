/*
  Warnings:

  - You are about to drop the column `frequency` on the `BowVector` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BowVector" DROP COLUMN "frequency";

-- CreateTable
CREATE TABLE "WordOccurrence" (
    "id" SERIAL NOT NULL,
    "bowVectorId" INTEGER NOT NULL,
    "frequency" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,

    CONSTRAINT "WordOccurrence_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WordOccurrence" ADD CONSTRAINT "WordOccurrence_bowVectorId_fkey" FOREIGN KEY ("bowVectorId") REFERENCES "BowVector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
