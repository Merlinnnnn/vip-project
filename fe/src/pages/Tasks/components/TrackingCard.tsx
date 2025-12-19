import { Clock3, MoreHorizontal, Pause, Play } from "lucide-react";
import type { Task } from "../../../types/task";

type Props = {
  tasks: Task[];
};

const TrackingCard = ({ tasks }: Props) => {
  const list = tasks.slice(0, 5);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-800">My tracking</div>
        <MoreHorizontal size={18} className="text-slate-400" />
      </div>
      <div className="space-y-2">
        {list.map((task, idx) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-slate-500" />
              <div className="font-semibold text-slate-800">{task.title}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                {task.learningMinutes ? `${task.learningMinutes}m` : "n/a"}
              </span>
              {idx === 0 ? (
                <button className="rounded-full border border-slate-200 bg-white p-1 hover:bg-slate-100">
                  <Pause size={14} />
                </button>
              ) : (
                <button className="rounded-full border border-slate-200 bg-white p-1 hover:bg-slate-100">
                  <Play size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackingCard;
