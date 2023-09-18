/*
  Warnings:

  - The primary key for the `BowVector` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `WordOccurrence` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bookName` on the `WordOccurrence` table. All the data in the column will be lost.
  - You are about to drop the column `chapter` on the `WordOccurrence` table. All the data in the column will be lost.
  - You are about to drop the column `verse` on the `WordOccurrence` table. All the data in the column will be lost.
  - The primary key for the `WordPosition` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `verseScoreId` to the `WordOccurrence` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "WordOccurrence" DROP CONSTRAINT "WordOccurrence_bowVectorId_fkey";

-- DropForeignKey
ALTER TABLE "WordPosition" DROP CONSTRAINT "WordPosition_bowVectorId_fkey";

-- DropForeignKey
ALTER TABLE "WordPosition" DROP CONSTRAINT "WordPosition_wordOccurrenceId_fkey";

-- AlterTable
ALTER TABLE "BowVector" DROP CONSTRAINT "BowVector_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "BowVector_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "BowVector_id_seq";

-- AlterTable
ALTER TABLE "WordOccurrence" DROP CONSTRAINT "WordOccurrence_pkey",
DROP COLUMN "bookName",
DROP COLUMN "chapter",
DROP COLUMN "verse",
ADD COLUMN     "verseScoreId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "bowVectorId" SET DATA TYPE TEXT,
ADD CONSTRAINT "WordOccurrence_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "WordOccurrence_id_seq";

-- AlterTable
ALTER TABLE "WordPosition" DROP CONSTRAINT "WordPosition_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "wordOccurrenceId" SET DATA TYPE TEXT,
ALTER COLUMN "bowVectorId" SET DATA TYPE TEXT,
ADD CONSTRAINT "WordPosition_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "WordPosition_id_seq";

-- CreateTable
CREATE TABLE "VerseScore" (
    "id" TEXT NOT NULL,
    "bookName" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "similarityIndex" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VerseScore_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WordPosition" ADD CONSTRAINT "WordPosition_wordOccurrenceId_fkey" FOREIGN KEY ("wordOccurrenceId") REFERENCES "WordOccurrence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPosition" ADD CONSTRAINT "WordPosition_bowVectorId_fkey" FOREIGN KEY ("bowVectorId") REFERENCES "BowVector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordOccurrence" ADD CONSTRAINT "WordOccurrence_verseScoreId_fkey" FOREIGN KEY ("verseScoreId") REFERENCES "VerseScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordOccurrence" ADD CONSTRAINT "WordOccurrence_bowVectorId_fkey" FOREIGN KEY ("bowVectorId") REFERENCES "BowVector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
