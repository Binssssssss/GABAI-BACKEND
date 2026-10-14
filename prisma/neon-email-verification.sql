-- GabAi: email verification columns (run once in the Neon SQL editor)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailVerificationCode" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "emailVerificationSentAt" TIMESTAMP(3);

-- Accounts that already exist stay usable (mark them as verified).
UPDATE "users" SET "emailVerified" = true;
