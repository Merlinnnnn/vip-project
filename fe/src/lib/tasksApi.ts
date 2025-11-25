import type { Task, TaskStatus } from "../types/task";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9999";

type TaskInput = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export function listTasks(): Promise<Task[]> {
  return request<Task[]>(`${API_URL}/tasks`);
}

export function createTask(input: TaskInput): Promise<Task> {
  return request<Task>(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateTask(id: string, input: TaskInput): Promise<Task> {
  return request<Task>(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`${API_URL}/tasks/${id}`, { method: "DELETE" });
}
