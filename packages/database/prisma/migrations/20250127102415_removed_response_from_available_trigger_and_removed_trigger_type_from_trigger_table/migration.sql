/*
  Warnings:

  - You are about to drop the column `response` on the `AvailableTrigger` table. All the data in the column will be lost.
  - You are about to drop the column `triggerType` on the `Trigger` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AvailableTrigger" DROP COLUMN "response";

-- AlterTable
ALTER TABLE "Trigger" DROP COLUMN "triggerType";
