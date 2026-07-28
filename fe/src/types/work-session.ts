export type WorkSession = {
  id: string;
  userId: string;
  taskId?: string | null;
  skillId?: string | null;
  startedAt: string;
  endedAt?: string | null;
  durationMin: number;
  note?: string | null;
  createdAt: string;
};

export type SessionStats = {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  bySkill: { skillId: string; skillName: string; totalMinutes: number }[];
  dailyHeatmap: { date: string; minutes: number }[];
  streak: number;
};
