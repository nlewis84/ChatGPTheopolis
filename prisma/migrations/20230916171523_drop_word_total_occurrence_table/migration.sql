/*
  Warnings:

  - You are about to drop the `WordTotalOccurrence` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `totalOccurrences` to the `BowVector` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "WordTotalOccurrence" DROP CONSTRAINT "WordTotalOccurrence_wordId_fkey";

-- AlterTable
ALTER TABLE "BowVector" ADD COLUMN     "totalOccurrences" INTEGER NOT NULL;

-- DropTable
DROP TABLE "WordTotalOccurrence";
