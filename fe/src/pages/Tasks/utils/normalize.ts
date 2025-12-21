import type { Task } from "../../../types/task";

export const normalizeTasks = (list: Task[]) => {
  return [...list].sort((a, b) => {
    const aDate = a.scheduledDate ?? "";
    const bDate = b.scheduledDate ?? "";
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    return (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER);
  });
};
