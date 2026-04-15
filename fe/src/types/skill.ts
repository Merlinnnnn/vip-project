export type Skill = {
  id: string;
  name: string;
  totalMinutes: number;
  targetMinutes: number;
  level: number;
  currentExp: number;
  expToNextLevel: number;
  rank: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface SkillStats {
  totalLevel: number;
  totalMinutes: number;
  skillsCount: number;
  topSkills: {
    name: string;
    level: number;
    totalMinutes: number;
    rank: string;
  }[];
  globalRank: string;
}
