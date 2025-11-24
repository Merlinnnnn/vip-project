import Card from "../common/Card";
import type { Task } from "../../types/task";

type Props = {
  tasks: Task[];
  onStatusChange?: (id: string, status: Task["status"]) => void;
  onDelete?: (id: string) => void;
};

const statusStyles: Record<Task["status"], string> = {
  todo: "bg-amber-50 text-amber-800",
  in_progress: "bg-blue-50 text-blue-800",
  done: "bg-emerald-50 text-emerald-700",
};

const TaskList = ({ tasks, onStatusChange, onDelete }: Props) => {
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
              {task.createdAt ? (
                <p className="text-xs text-slate-500">Created {new Date(task.createdAt).toLocaleString()}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1 py-1 text-xs">
                {(["todo", "in_progress", "done"] as Task["status"][]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`rounded px-2 py-1 font-semibold transition ${
                      task.status === st
                        ? st === "done"
                          ? "bg-emerald-100 text-emerald-800"
                          : st === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    onClick={() => onStatusChange?.(task.id, st)}
                  >
                    {st === "in_progress" ? "In progress" : st === "done" ? "Done" : "To do"}
                  </button>
                ))}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[task.status]}`}
              >
                {task.status === "in_progress"
                  ? "In progress"
                  : task.status === "done"
                    ? "Done"
                    : "To do"}
              </span>
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
