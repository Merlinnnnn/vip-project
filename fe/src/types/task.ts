export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  userId?: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
};
