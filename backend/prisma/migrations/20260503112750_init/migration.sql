-- CreateEnum
CREATE TYPE "Status" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('P0', 'P1', 'P2', 'P3');

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'OPEN',
    "priority" "Priority" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RCA" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "rootCauseCategory" TEXT NOT NULL,
    "fixApplied" TEXT NOT NULL,
    "preventionSteps" TEXT NOT NULL,
    "mttr" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RCA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "mongoSignalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RCA_workItemId_key" ON "RCA"("workItemId");

-- AddForeignKey
ALTER TABLE "RCA" ADD CONSTRAINT "RCA_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
