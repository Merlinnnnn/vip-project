import { BaseApi } from "./baseApi";
import type { Skill, SkillStats } from "../types/skill";
import type { AuthHeaders } from "../types/api";
import { buildAuthHeaders } from "../types/api";

export type SkillInput = {
  name: string;
  targetMinutes?: number;
};

const api = new BaseApi("skills");

export const listSkills = (auth: AuthHeaders): Promise<Skill[]> =>
  api.get<Skill[]>("", { headers: buildAuthHeaders(auth) });

export const createSkill = (auth: AuthHeaders, input: SkillInput): Promise<Skill> =>
  api.post<Skill>("", input, { headers: buildAuthHeaders(auth) });

export const updateSkill = (auth: AuthHeaders, id: string, input: Partial<SkillInput>): Promise<Skill> =>
  api.put<Skill>(id, input, { headers: buildAuthHeaders(auth) });

export const deleteSkill = (auth: AuthHeaders, id: string): Promise<void> =>
  api.delete<void>(id, { headers: buildAuthHeaders(auth) });

export const getStats = (auth: AuthHeaders): Promise<SkillStats> =>
  api.get<SkillStats>("stats", { headers: buildAuthHeaders(auth) });
