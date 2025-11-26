import { BaseApi } from "./baseApi";
import type { AuthResponse } from "../types/auth";

const authApi = new BaseApi("auth");

export const login = (email: string, password: string): Promise<AuthResponse> =>
  authApi.post<AuthResponse>("login", { email, password });

export const register = (email: string, password: string, name?: string): Promise<AuthResponse> =>
  authApi.post<AuthResponse>("register", { email, password, name });

export const getMe = (userId: string): Promise<{ id: string; email: string }> =>
  authApi.get<{ id: string; email: string }>("me", { headers: { "x-user-id": userId } });

export const refresh = (refreshToken: string): Promise<AuthResponse> =>
  authApi.post<AuthResponse>("refresh", { refreshToken });
