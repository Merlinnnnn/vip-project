import Card from "../../../components/ui/Card";
import { statusMeta } from "../../../components/shared/taskMeta";
import type { Task } from "../../../types/task";

type Props = {
  tasks: Task[];
  activeTaskId: string | null;
  isLoading: boolean;
  error: Error | null;
  onSelectTask: (task: Task) => void;
};

const TasksTable = ({ tasks, activeTaskId, isLoading, error, onSelectTask }: Props) => {
  return (
    <Card title="Tasks">
      {error ? (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {error.message}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-slate-100/70 bg-white/40 backdrop-blur">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/80 text-left text-xs uppercase text-slate-500 backdrop-blur">
            <tr>
              <th className="px-4 py-2">Task</th>
              <th className="px-4 py-2">Day</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Est. (min)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/60 backdrop-blur">
            {tasks.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={4}>
                  {isLoading ? "Loading tasks..." : "No tasks found."}
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const isActive = task.id === activeTaskId;
                return (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className={`cursor-pointer transition ${
                      isActive
                        ? "bg-white text-slate-900 shadow-inner"
                        : "hover:bg-white/70"
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">{task.title}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${statusMeta[task.status].badge} ${statusMeta[task.status].badgeText} ${statusMeta[task.status].badgeBorder}`}
                      >
                        {statusMeta[task.status].icon}
                        <span>{statusMeta[task.status].label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{task.estimatedMinutes ?? "-"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TasksTable;
