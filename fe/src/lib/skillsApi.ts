import { BaseApi } from "./baseApi";
import type { Skill } from "../types/skill";

type AuthHeaders = {
  userId: string;
  token?: string | null;
};

type SkillInput = {
  name: string;
  targetMinutes?: number;
};

const skillApi = new BaseApi("skills");

const withAuthHeaders = (auth: AuthHeaders, extra?: Record<string, string>) => ({
  ...(extra ?? {}),
  "x-user-id": auth.userId,
});

export const listSkills = (auth: AuthHeaders): Promise<Skill[]> =>
  skillApi.get<Skill[]>("", {
    headers: withAuthHeaders(auth, auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined),
  });

export const createSkill = (auth: AuthHeaders, input: SkillInput): Promise<Skill> =>
  skillApi.post<Skill>("", input, {
    headers: withAuthHeaders(auth, auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined),
  });
