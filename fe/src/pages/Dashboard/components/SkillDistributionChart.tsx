import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import Card from "../../../components/ui/Card";
import type { SessionStats } from "../../../types/work-session";

type Props = {
  bySkill: SessionStats["bySkill"];
};

const SkillDistributionChart = ({ bySkill }: Props) => {
  const chartData = useMemo(() => {
    // Sắp xếp giảm dần theo số phút
    const sorted = [...bySkill].sort((a, b) => b.totalMinutes - a.totalMinutes);
    const top = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((acc, curr) => acc + curr.totalMinutes, 0);

    const labels = top.map((s) => s.skillName);
    const data = top.map((s) => s.totalMinutes);

    if (others > 0) {
      labels.push("Khác");
      data.push(others);
    }

    if (data.length === 0) {
      labels.push("Chưa có dữ liệu");
      data.push(1);
    }

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#3b82f6", // blue-500
            "#10b981", // emerald-500
            "#f59e0b", // amber-500
            "#8b5cf6", // violet-500
            "#ec4899", // pink-500
            "#94a3b8", // slate-400 (Khác)
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    };
  }, [bySkill]);

  const chartOptions = useMemo(
    () => ({
      plugins: {
        legend: {
          position: "right" as const,
          labels: { boxWidth: 14, boxHeight: 14, padding: 12 },
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              if (context.label === "Chưa có dữ liệu") return " 0h 0m";
              const minutes = context.raw as number;
              const h = Math.floor(minutes / 60);
              const m = minutes % 60;
              return ` ${h}h ${m}m`;
            },
          },
        },
      },
      cutout: "65%",
      maintainAspectRatio: false,
    }),
    []
  );

  return (
    <Card title="Phân bổ thời gian theo Skill">
      <div className="h-64 w-full">
        <Doughnut data={chartData} options={chartOptions} />
      </div>
    </Card>
  );
};

export default SkillDistributionChart;
