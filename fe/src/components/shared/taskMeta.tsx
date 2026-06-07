import { CheckSquare, Circle, Clock3 } from "lucide-react";
import type { TaskStatus } from "../../types/task";
import type { JSX } from "react";

/**
 * statusMeta — metadata hiển thị cho từng trạng thái task.
 * Đã được chuyển từ pages/Tasks/meta.tsx lên components/shared/
 * để có thể dùng chung ở TimeTrackingPage mà không cần import xuyên page.
 */
export const statusMeta: Record<
  TaskStatus,
  { label: string; icon: JSX.Element; badge: string; badgeText: string; badgeBorder: string }
> = {
  todo: {
    label: "To do",
    icon: <Circle size={14} />,
    badge: "bg-slate-100",
    badgeText: "text-slate-700",
    badgeBorder: "border-slate-200",
  },
  in_progress: {
    label: "In progress",
    icon: <Clock3 size={14} />,
    badge: "bg-amber-100",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-200",
  },
  done: {
    label: "Done",
    icon: <CheckSquare size={14} />,
    badge: "bg-emerald-100",
    badgeText: "text-emerald-800",
    badgeBorder: "border-emerald-200",
  },
  overdue: {
    label: "Overdue",
    icon: <Clock3 size={14} />,
    badge: "bg-rose-100",
    badgeText: "text-rose-800",
    badgeBorder: "border-rose-200",
  },
};
