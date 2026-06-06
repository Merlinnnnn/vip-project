import { BaseApi } from "./baseApi";
import type { Task, TaskStatus } from "../types/task";
import type { AuthHeaders } from "../types/api";
import { buildAuthHeaders } from "../types/api";

export type TaskInput = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: number;
  dueDate?: string;
  learningMinutes?: number;
  skillId?: string | null;
};

const api = new BaseApi("tasks");

export const listTasks = (auth: AuthHeaders): Promise<Task[]> =>
  api.get<Task[]>("", { headers: buildAuthHeaders(auth) });

export const createTask = (auth: AuthHeaders, input: TaskInput): Promise<Task> =>
  api.post<Task>("", input, { headers: buildAuthHeaders(auth) });

export const updateTask = (auth: AuthHeaders, id: string, input: TaskInput): Promise<Task> =>
  api.put<Task>(id, input, { headers: buildAuthHeaders(auth) });

export const deleteTask = (auth: AuthHeaders, id: string): Promise<void> =>
  api.delete<void>(id, { headers: buildAuthHeaders(auth) });
