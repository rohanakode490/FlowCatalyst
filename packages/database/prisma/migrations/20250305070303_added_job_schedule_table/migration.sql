-- CreateTable
CREATE TABLE "JobSchedule" (
    "id" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 10,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobSchedule_triggerId_key" ON "JobSchedule"("triggerId");

-- CreateIndex
CREATE INDEX "JobSchedule_nextRunAt_idx" ON "JobSchedule"("nextRunAt");

-- CreateIndex
CREATE INDEX "JobSchedule_userId_idx" ON "JobSchedule"("userId");

-- AddForeignKey
ALTER TABLE "JobSchedule" ADD CONSTRAINT "JobSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
