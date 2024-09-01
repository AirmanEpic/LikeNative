/*
  Warnings:

  - Added the required column `sessionId` to the `CardAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeTaken` to the `CardAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CardAttempt" ADD COLUMN     "sessionId" TEXT NOT NULL,
ADD COLUMN     "timeTaken" INTEGER NOT NULL;
