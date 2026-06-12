import Card from "../../../components/ui/Card";
import type { TaskStatus } from "../../../types/task";

type StatusStats = Record<TaskStatus, number>;

type Props = {
  statusStats: StatusStats;
  tasks: { length: number };
  monthlyDone: number;
  completionRate: number;
};

const StatsCards = ({ statusStats, tasks, monthlyDone, completionRate }: Props) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <p className="text-xs uppercase tracking-wide text-slate-500">Task hoàn thành</p>
        <p className="text-3xl font-bold text-emerald-600">{statusStats.done}</p>
        <p className="text-sm text-slate-600">Tháng này: {monthlyDone}</p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-wide text-slate-500">Đang làm</p>
        <p className="text-3xl font-bold text-blue-600">{statusStats.in_progress}</p>
        <p className="text-sm text-slate-600">Chưa xong, ưu tiên tiếp</p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-wide text-slate-500">Chưa bắt đầu</p>
        <p className="text-3xl font-bold text-amber-600">{statusStats.todo}</p>
        <p className="text-sm text-slate-600">Tổng task: {tasks.length}</p>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Tỉ lệ hoàn thành</p>
            <p className="text-3xl font-bold text-slate-900">{completionRate}%</p>
            <p className="text-sm text-slate-600">Tổng task: {tasks.length}</p>
          </div>
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
            style={{
              background: `conic-gradient(#10b981 ${completionRate}%, #e2e8f0 ${completionRate}% 100%)`,
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 shadow-inner">
              {completionRate}%
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StatsCards;
