-- CreateTable
CREATE TABLE "recent_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recent_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recent_activities_userId_idx" ON "recent_activities"("userId");

-- CreateIndex
CREATE INDEX "recent_activities_createdAt_idx" ON "recent_activities"("createdAt");

-- AddForeignKey
ALTER TABLE "recent_activities" ADD CONSTRAINT "recent_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
