import { BaseApi } from "./baseApi";
import type { Task, TaskStatus } from "../types/task";

type TaskInput = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: number;
};

type AuthHeaders = {
  userId: string;
  token?: string | null;
};

const taskApi = new BaseApi("tasks");

const withAuthHeaders = (auth: AuthHeaders, extra?: Record<string, string>) => ({
  ...(extra ?? {}),
  "x-user-id": auth.userId,
});

export const listTasks = (auth: AuthHeaders): Promise<Task[]> =>
  taskApi.get<Task[]>("", {
    headers: withAuthHeaders(auth, auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined),
  });

export const createTask = (auth: AuthHeaders, input: TaskInput): Promise<Task> =>
  taskApi.post<Task>("", input, {
    headers: withAuthHeaders(auth, auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined),
  });

export const updateTask = (auth: AuthHeaders, id: string, input: TaskInput): Promise<Task> =>
  taskApi.put<Task>(id, input, {
    headers: withAuthHeaders(auth, auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined),
  });

export const deleteTask = (auth: AuthHeaders, id: string): Promise<void> =>
  taskApi.delete<void>(id, {
    headers: withAuthHeaders(auth, auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined),
  });
