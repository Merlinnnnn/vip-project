import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import Card from "../../../components/common/Card";

type WeeklyEntry = { label: string; created: number; done: number };

type Props = {
  weeklyActivity: WeeklyEntry[];
  sparklinePoints: string;
};

const ActivityChart = ({ weeklyActivity, sparklinePoints }: Props) => {
  const barData = useMemo(
    () => ({
      labels: weeklyActivity.map((d) => d.label),
      datasets: [
        {
          label: "Tạo",
          data: weeklyActivity.map((d) => d.created),
          backgroundColor: "rgba(59, 130, 246, 0.6)",
        },
        {
          label: "Hoàn thành",
          data: weeklyActivity.map((d) => d.done),
          backgroundColor: "rgba(16, 185, 129, 0.7)",
        },
      ],
    }),
    [weeklyActivity],
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: true, position: "top" as const },
        title: { display: false },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, ticks: { stepSize: 1 } },
      },
    }),
    [],
  );

  return (
    <Card title="Hoạt động 7 ngày">
      <div className="space-y-4">
        <Bar data={barData} options={barOptions} className="max-h-72" />
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Xu hướng hoàn thành</span>
            <span className="text-emerald-600">7d</span>
          </div>
          <svg viewBox="0 0 140 50" className="mt-2 h-16 w-full text-emerald-500">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              points={sparklinePoints}
              className="drop-shadow-sm"
            />
          </svg>
        </div>
      </div>
    </Card>
  );
};

export default ActivityChart;
