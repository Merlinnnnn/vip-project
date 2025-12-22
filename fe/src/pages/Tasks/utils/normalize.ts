import type { Task } from "../../../types/task";

export const normalizeTasks = (list: Task[]) => {
  const key = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");
  return [...list].sort((a, b) => {
    const aDate = key(a.dueDate);
    const bDate = key(b.dueDate);
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    return (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER);
  });
};
