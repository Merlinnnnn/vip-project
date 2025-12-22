export type TaskStatus = "todo" | "in_progress" | "done" | "overdue";

export type Task = {
  id: string;
  userId?: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority?: number;
  dueDate: string;
  learningMinutes?: number;
  skillId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
