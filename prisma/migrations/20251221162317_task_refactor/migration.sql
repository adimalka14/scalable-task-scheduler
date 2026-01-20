/*
  Warnings:

  - The `status` column on the `Notification` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('CREATED', 'SCHEDULED', 'CANCELLED', 'EXECUTING', 'EXECUTED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('TASK_REMINDER');

-- AlterTable
ALTER TABLE "public"."Notification" DROP COLUMN "type",
ADD COLUMN     "type" "public"."NotificationType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."NotificationStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "sentAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "executedAt" TIMESTAMP(3),
ADD COLUMN     "executingAt" TIMESTAMP(3),
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lockToken" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "status" "public"."TaskStatus" NOT NULL DEFAULT 'CREATED';

-- CreateIndex
CREATE INDEX "Notification_taskId_idx" ON "public"."Notification"("taskId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "public"."Notification"("status");
