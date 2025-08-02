/*
  Warnings:

  - You are about to drop the column `googleAccessToken` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleRefreshToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_googleAccessToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleAccessToken",
ADD COLUMN     "googleRefreshToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleRefreshToken_key" ON "User"("googleRefreshToken");
