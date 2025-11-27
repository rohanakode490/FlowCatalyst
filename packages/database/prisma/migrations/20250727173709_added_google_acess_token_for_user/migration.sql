/*
  Warnings:

  - A unique constraint covering the columns `[googleAccessToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleAccessToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleAccessToken_key" ON "User"("googleAccessToken");
