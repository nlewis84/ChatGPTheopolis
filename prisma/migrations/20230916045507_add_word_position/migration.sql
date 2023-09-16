/*
  Warnings:

  - You are about to drop the column `position` on the `WordOccurrence` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WordOccurrence" DROP COLUMN "position";

-- CreateTable
CREATE TABLE "WordPosition" (
    "id" SERIAL NOT NULL,
    "wordOccurrenceId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "bowVectorId" INTEGER,

    CONSTRAINT "WordPosition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WordPosition" ADD CONSTRAINT "WordPosition_wordOccurrenceId_fkey" FOREIGN KEY ("wordOccurrenceId") REFERENCES "WordOccurrence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPosition" ADD CONSTRAINT "WordPosition_bowVectorId_fkey" FOREIGN KEY ("bowVectorId") REFERENCES "BowVector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
