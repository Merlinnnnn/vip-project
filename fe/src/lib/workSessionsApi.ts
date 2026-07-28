import { BaseApi } from "./baseApi";
import type { AuthHeaders } from "../types/api";
import { buildAuthHeaders } from "../types/api";
import type { WorkSession, SessionStats } from "../types/work-session";

const api = new BaseApi("work-sessions");

export type StartSessionInput = {
  taskId?: string;
  skillId?: string;
};

export type StopSessionInput = {
  note?: string;
};

export const startSession = (auth: AuthHeaders, input: StartSessionInput): Promise<WorkSession> =>
  api.post<WorkSession>("start", input, { headers: buildAuthHeaders(auth) });

export const stopSession = (auth: AuthHeaders, id: string, input: StopSessionInput): Promise<WorkSession> =>
  api.put<WorkSession>(`${id}/stop`, input, { headers: buildAuthHeaders(auth) });

export const getActiveSession = (auth: AuthHeaders): Promise<WorkSession | null> =>
  api.get<WorkSession | null>("active", { headers: buildAuthHeaders(auth) });

export const listSessions = (
  auth: AuthHeaders,
  params?: { from?: string; to?: string }
): Promise<WorkSession[]> =>
  api.get<WorkSession[]>("", {
    headers: buildAuthHeaders(auth),
    searchParams: params,
  });

export const getSessionStats = (auth: AuthHeaders): Promise<SessionStats> =>
  api.get<SessionStats>("stats", { headers: buildAuthHeaders(auth) });
