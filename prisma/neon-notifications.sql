-- GabAi: notification + Google password changes (run once in the Neon SQL editor)

-- 1) Who manages the password: "email" (GabAi) or "google"
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "authProvider" TEXT NOT NULL DEFAULT 'email';

-- Existing accounts that have signed in with Google
UPDATE "users" SET "authProvider" = 'google' WHERE "firebaseUid" IS NOT NULL;

-- 2) "Task overdue" push is sent only once per task
ALTER TABLE "tasks"
  ADD COLUMN IF NOT EXISTS "overdueNotifiedAt" TIMESTAMP(3);
