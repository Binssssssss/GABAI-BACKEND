-- CreateTable
CREATE TABLE "focus_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "remainingTime" INTEGER NOT NULL,
    "targetHours" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "focus_sessions_userId_idx" ON "focus_sessions"("userId");

-- CreateIndex
CREATE INDEX "focus_sessions_status_idx" ON "focus_sessions"("status");

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
