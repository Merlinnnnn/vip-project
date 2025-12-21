export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  userId?: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority?: number;
  scheduledDate?: string | null;
  learningMinutes?: number;
  skillId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
