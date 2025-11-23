const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string };
};

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  return request<AuthResponse>(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
}

export async function getMe(userId: string): Promise<{ id: string; email: string }> {
  return request<{ id: string; email: string }>(`${API_URL}/auth/me`, {
    headers: { "x-user-id": userId },
  });
}
