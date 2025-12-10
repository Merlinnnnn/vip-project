import { create } from "zustand";
import type { Skill } from "../types/skill";

type SkillsState = {
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  addSkill: (skill: Skill) => void;
  bumpMinutes: (skillId: string, delta: number) => void;
  clear: () => void;
};

export const useSkillsStore = create<SkillsState>((set) => ({
  skills: [],
  setSkills: (skills) => set({ skills }),
  addSkill: (skill) =>
    set((state) => ({
      skills: [...state.skills.filter((s) => s.id !== skill.id), skill],
    })),
  bumpMinutes: (skillId, delta) =>
    set((state) => ({
      skills: state.skills.map((s) =>
        s.id === skillId
          ? { ...s, totalMinutes: Math.max(0, (s.totalMinutes ?? 0) + delta) }
          : s,
      ),
    })),
  clear: () => set({ skills: [] }),
}));
