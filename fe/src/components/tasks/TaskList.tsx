import Card from "../common/Card";
import type { Task } from "../../types/task";

type Props = {
  tasks: Task[];
};

const statusStyles: Record<Task["status"], string> = {
  todo: "bg-amber-50 text-amber-800",
  "in-progress": "bg-blue-50 text-blue-800",
  done: "bg-emerald-50 text-emerald-700",
};

const TaskList = ({ tasks }: Props) => {
  return (
    <Card title="Tasks">
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm"
          >
            <div>
              <p className="font-semibold text-slate-900">{task.title}</p>
              <p className="text-xs text-slate-600">Due {task.dueDate}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[task.status]}`}
            >
              {task.status === "in-progress"
                ? "In progress"
                : task.status === "done"
                  ? "Done"
                  : "To do"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TaskList;
