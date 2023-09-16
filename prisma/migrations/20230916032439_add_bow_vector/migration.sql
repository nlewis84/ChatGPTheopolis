-- CreateTable
CREATE TABLE "BowVector" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,

    CONSTRAINT "BowVector_pkey" PRIMARY KEY ("id")
);
