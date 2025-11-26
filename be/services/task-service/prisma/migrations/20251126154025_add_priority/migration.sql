-- AlterTable
CREATE SEQUENCE task_priority_seq;
ALTER TABLE "Task" ALTER COLUMN "priority" SET DEFAULT nextval('task_priority_seq');
ALTER SEQUENCE task_priority_seq OWNED BY "Task"."priority";
