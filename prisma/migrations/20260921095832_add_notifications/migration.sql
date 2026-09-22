/*
  Warnings:

  - Added the required column `icon` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iconColor` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "assignmentId" TEXT,
ADD COLUMN     "icon" TEXT NOT NULL,
ADD COLUMN     "iconColor" TEXT NOT NULL,
ADD COLUMN     "taskId" TEXT,
ADD COLUMN     "time" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_taskId_idx" ON "notifications"("taskId");

-- CreateIndex
CREATE INDEX "notifications_assignmentId_idx" ON "notifications"("assignmentId");
