-- CreateTable
CREATE TABLE "WordTotalOccurrence" (
    "id" SERIAL NOT NULL,
    "wordId" INTEGER NOT NULL,
    "totalOccurrences" INTEGER NOT NULL,

    CONSTRAINT "WordTotalOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WordTotalOccurrence_wordId_key" ON "WordTotalOccurrence"("wordId");

-- AddForeignKey
ALTER TABLE "WordTotalOccurrence" ADD CONSTRAINT "WordTotalOccurrence_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "BowVector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
