/*
  Warnings:

  - Added the required column `bookName` to the `WordOccurrence` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WordOccurrence" ADD COLUMN     "bookName" TEXT NOT NULL;
