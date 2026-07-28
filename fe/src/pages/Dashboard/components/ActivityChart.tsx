import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import Card from "../../../components/ui/Card";
import type { SessionStats } from "../../../types/work-session";

type Props = {
  dailyHeatmap: SessionStats["dailyHeatmap"];
};

const formatDayLabel = (dateStr: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(dateStr));

const ActivityChart = ({ dailyHeatmap }: Props) => {
  const last7Days = useMemo(() => dailyHeatmap.slice(-7), [dailyHeatmap]);

  const barData = useMemo(
    () => ({
      labels: last7Days.map((d) => formatDayLabel(d.date)),
      datasets: [
        {
          label: "Thời gian làm việc (phút)",
          data: last7Days.map((d) => d.minutes),
          backgroundColor: "rgba(16, 185, 129, 0.7)", // emerald-500
          borderRadius: 4,
        },
      ],
    }),
    [last7Days],
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const val = context.raw as number;
              const h = Math.floor(val / 60);
              const m = val % 60;
              return h > 0 ? ` ${h}h ${m}m` : ` ${m}m`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    }),
    [],
  );

  const sparklinePoints = useMemo(() => {
    const values = dailyHeatmap.map((d) => d.minutes);
    const width = 140;
    const height = 50;
    const max = Math.max(...values, 1);
    const step = values.length > 1 ? width / (values.length - 1) : 0;
    return values
      .map((v, idx) => {
        const x = idx * step;
        const y = height - (v / max) * (height - 6) - 3;
        return `${x},${y}`;
      })
      .join(" ");
  }, [dailyHeatmap]);

  return (
    <Card title="Hoạt động 7 ngày">
      <div className="space-y-4">
        <Bar data={barData} options={barOptions} className="max-h-72" />
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Xu hướng hoạt động</span>
            <span className="text-emerald-600">30d</span>
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
