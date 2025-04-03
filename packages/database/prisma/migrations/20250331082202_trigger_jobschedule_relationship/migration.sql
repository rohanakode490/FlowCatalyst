-- DropIndex
DROP INDEX "JobSchedule_triggerId_key";

-- AddForeignKey
ALTER TABLE "JobSchedule" ADD CONSTRAINT "JobSchedule_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "Trigger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
