import { MoreHorizontal } from "lucide-react";
import type { Task } from "../../../types/task";
import { statusMeta } from "../meta";

type Props = {
  tasks: Task[];
};

const TaskListCard = ({ tasks }: Props) => {
  const top = tasks.slice(0, 5);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-800">My tasks ({top.length.toString().padStart(2, "0")})</div>
        <MoreHorizontal size={18} className="text-slate-400" />
      </div>
      <div className="space-y-2">
        {top.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-amber-500">{statusMeta[task.status].icon}</span>
              <div>
                <div className="font-semibold text-slate-800">{task.title}</div>
                <div className="text-xs text-slate-500">{statusMeta[task.status].label}</div>
              </div>
            </div>
            <div className="text-right text-xs text-amber-500">Today</div>
          </div>
        ))}
        {top.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
            No tasks yet. Click "New task" to create one.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TaskListCard;
