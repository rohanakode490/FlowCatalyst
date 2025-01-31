/*
  Warnings:

  - You are about to drop the column `response` on the `Trigger` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Trigger" DROP COLUMN "response",
ADD COLUMN     "triggerType" TEXT NOT NULL DEFAULT '';
