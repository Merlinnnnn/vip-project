-- Add overdue status and required due date on tasks
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'overdue';

ALTER TABLE "Task"
ADD COLUMN "dueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows with createdAt if present
UPDATE "Task"
SET "dueDate" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "dueDate" IS NULL;
