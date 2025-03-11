/*
  Warnings:

  - You are about to drop the column `stripePriceId` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dodoCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "stripePriceId",
ADD COLUMN     "dodoPriceId" TEXT;

-- AlterTable
ALTER TABLE "Trigger" ADD COLUMN     "userId" INTEGER NOT NULL DEFAULT -1;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "stripeCustomerId",
ADD COLUMN     "dodoCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_dodoCustomerId_key" ON "User"("dodoCustomerId");

-- AddForeignKey
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
