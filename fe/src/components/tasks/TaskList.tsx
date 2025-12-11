import Card from "../common/Card";
import type { Task } from "../../types/task";

type Props = {
  tasks: Task[];
  onDelete?: (id: string) => void;
  skillNames?: Record<string, string>;
};

const statusStyles: Record<Task["status"], string> = {
  todo: "bg-amber-50 text-amber-800",
  in_progress: "bg-blue-50 text-blue-800",
  done: "bg-emerald-50 text-emerald-700",
};

const TaskList = ({ tasks, onDelete, skillNames }: Props) => {
  return (
    <Card title="Tasks">
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{task.title}</p>
              {task.description ? (
                <p className="text-xs text-slate-600">{task.description}</p>
              ) : null}
              {task.skillId || task.learningMinutes ? (
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  {task.skillId ? `Skill: ${skillNames?.[task.skillId] ?? task.skillId}` : null}
                  {task.skillId && task.learningMinutes ? " • " : null}
                  {task.learningMinutes ? `${task.learningMinutes} phút` : null}
                </p>
              ) : null}
              {task.createdAt ? (
                <p className="text-xs text-slate-500">Created {new Date(task.createdAt).toLocaleString()}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>
                {task.status === "in_progress"
                  ? "In progress"
                  : task.status === "done"
                    ? "Done"
                    : "To do"}
              </span>
              <span className="text-[11px] text-slate-500">Trang thai cap nhat qua dong ho task.</span>
              {onDelete ? (
                <button
                  type="button"
                  className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  onClick={() => onDelete(task.id)}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TaskList;
