-- Add priority column for task ordering and drag/drop persistence
ALTER TABLE "Task"
ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

-- Optional: backfill with createdAt order if needed
UPDATE "Task"
SET "priority" = EXTRACT(EPOCH FROM "createdAt")::bigint
WHERE "priority" = 0;
