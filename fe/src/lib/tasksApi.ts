import type { Task, TaskStatus } from "../types/task";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9999";

type TaskInput = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
};

type AuthHeaders = {
  userId: string;
  token?: string | null;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

function buildHeaders(auth: AuthHeaders, extra?: Record<string, string>) {
  const headers: Record<string, string> = { ...(extra ?? {}), "x-user-id": auth.userId };
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
  return headers;
}

export function listTasks(auth: AuthHeaders): Promise<Task[]> {
  return request<Task[]>(`${API_URL}/tasks`, { headers: buildHeaders(auth) });
}

export function createTask(auth: AuthHeaders, input: TaskInput): Promise<Task> {
  return request<Task>(`${API_URL}/tasks`, {
    method: "POST",
    headers: buildHeaders(auth, { "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });
}

export function updateTask(auth: AuthHeaders, id: string, input: TaskInput): Promise<Task> {
  return request<Task>(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: buildHeaders(auth, { "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  });
}

export function deleteTask(auth: AuthHeaders, id: string): Promise<void> {
  return request<void>(`${API_URL}/tasks/${id}`, { method: "DELETE", headers: buildHeaders(auth) });
}
