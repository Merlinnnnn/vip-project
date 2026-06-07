import { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import Card from "../../../components/common/Card";
import type { TaskStatus } from "../../../types/task";

type StatusStats = Record<TaskStatus, number>;

type TimeStats = {
  avgHours: number;
  fastestHours: number;
  avgOpenDays: number;
  completedCount: number;
};

type Props = {
  statusStats: StatusStats;
  tasksLength: number;
  timeStats: TimeStats;
};

const StatusChart = ({ statusStats, tasksLength, timeStats }: Props) => {
  const statusPieData = useMemo(
    () => ({
      labels: ["Hoàn thành", "Đang làm", "Chờ"],
      datasets: [
        {
          data: [statusStats.done, statusStats.in_progress, statusStats.todo],
          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    }),
    [statusStats.done, statusStats.in_progress, statusStats.todo],
  );

  const pieOptions = useMemo(
    () => ({
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: { boxWidth: 14, boxHeight: 14, padding: 12 },
        },
      },
    }),
    [],
  );

  return (
    <>
      <Card title="Phân bổ trạng thái">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-[180px] flex-1">
            <Pie data={statusPieData} options={pieOptions} />
          </div>
          <div className="flex-1 space-y-3">
            {(["done", "in_progress", "todo", "overdue"] as TaskStatus[]).map((status) => {
              const label =
                status === "done"
                  ? "Hoàn thành"
                  : status === "in_progress"
                  ? "Đang làm"
                  : status === "todo"
                  ? "Chờ"
                  : "Quá hạn";
              const color =
                status === "done"
                  ? "bg-emerald-500"
                  : status === "in_progress"
                  ? "bg-blue-500"
                  : status === "todo"
                  ? "bg-amber-500"
                  : "bg-rose-500";
              const count = statusStats[status];
              const percent = tasksLength
                ? Math.round((count / tasksLength) * 100)
                : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                    <span>{label}</span>
                    <span className="text-xs text-slate-500">{percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{count} task</p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card title="Thống kê thời gian">
        <div className="space-y-2 text-sm text-slate-700">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Hoàn thành TB</span>
            <span className="font-semibold text-slate-900">
              {timeStats.avgHours
                ? `${timeStats.avgHours.toFixed(1)} giờ`
                : "Chưa đủ dữ liệu"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Nhanh nhất</span>
            <span className="font-semibold text-emerald-700">
              {timeStats.fastestHours
                ? `${timeStats.fastestHours.toFixed(1)} giờ`
                : "Chưa đủ dữ liệu"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Tuổi TB task đang mở</span>
            <span className="font-semibold text-blue-700">
              {timeStats.avgOpenDays
                ? `${timeStats.avgOpenDays.toFixed(1)} ngày`
                : "Chưa đủ dữ liệu"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Dựa trên thời gian created/updated từ API. Cập nhật task để có số liệu chính xác.
          </p>
        </div>
      </Card>
    </>
  );
};

export default StatusChart;
