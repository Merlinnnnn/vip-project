import { CheckSquare, Circle, Clock3 } from "lucide-react";
import type { TaskStatus } from "../../types/task";
import type { JSX } from "react";

export const statusMeta: Record<TaskStatus, { label: string; color: string; icon: JSX.Element }> = {
  todo: { label: "To do", color: "text-slate-600", icon: <Circle size={14} /> },
  in_progress: { label: "In progress", color: "text-amber-600", icon: <Clock3 size={14} /> },
  done: { label: "Done", color: "text-emerald-700", icon: <CheckSquare size={14} /> },
};
