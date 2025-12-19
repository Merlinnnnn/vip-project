import type { Task } from "../../../types/task";

export const normalizeTasks = (list: Task[]) => {
  const sorted = [...list].sort(
    (a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER),
  );
  return sorted.map((t, idx) => ({ ...t, priority: idx + 1 }));
};
