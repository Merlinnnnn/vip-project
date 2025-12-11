import { useEffect, useMemo, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import Card from "../../components/common/Card";
import PageTitle from "../../components/common/PageTitle";
import TaskList from "../../components/tasks/TaskList";
import { listTasks } from "../../lib/tasksApi";
import { listSkills } from "../../lib/skillsApi";
import { useAuth } from "../../routes/AuthContext";
import { useTasksStore } from "../../store/useTasksStore";
import { useSkillsStore } from "../../store/useSkillsStore";
import type { Task, TaskStatus } from "../../types/task";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const normalizeTasks = (list: Task[]) =>
  [...list].sort(
    (a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER),
  );

const toDate = (input?: string) => {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
};

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatDayLabel = (date: Date) =>
  new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" }).format(date);

const DashboardPage = () => {
  const { user, token } = useAuth();
  const { tasks, setTasks } = useTasksStore();
  const { skills, setSkills } = useSkillsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useMemo(
    () => async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const data = await listTasks({ userId: user.id, token });
        setTasks(normalizeTasks(data));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [setTasks, token, user],
  );

  const loadSkills = useMemo(
    () => async () => {
      if (!user) return;
      try {
        const data = await listSkills({ userId: user.id, token });
        setSkills(data);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [setSkills, token, user],
  );

  useEffect(() => {
    void loadTasks();
    void loadSkills();
  }, [loadSkills, loadTasks]);

  const statusStats = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc[task.status] += 1;
        return acc;
      },
      { todo: 0, in_progress: 0, done: 0 },
    );
  }, [tasks]);

  const weeklyActivity = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - idx));
      const key = date.toISOString().slice(0, 10);
      return { key, date };
    });

    const createdMap: Record<string, number> = {};
    const doneMap: Record<string, number> = {};

    tasks.forEach((task) => {
      const createdKey = toDate(task.createdAt)?.toISOString().slice(0, 10);
      if (createdKey) createdMap[createdKey] = (createdMap[createdKey] ?? 0) + 1;

      if (task.status === "done") {
        const doneKey = toDate(task.updatedAt ?? task.createdAt)?.toISOString().slice(0, 10);
        if (doneKey) doneMap[doneKey] = (doneMap[doneKey] ?? 0) + 1;
      }
    });

    return days.map(({ key, date }) => ({
      label: formatDayLabel(date),
      created: createdMap[key] ?? 0,
      done: doneMap[key] ?? 0,
    }));
  }, [tasks]);

  const skillNames = useMemo(() => {
    const map: Record<string, string> = {};
    skills.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [skills]);

  const timeStats = useMemo(() => {
    const doneDurations = tasks
      .filter((t) => t.status === "done")
      .map((t) => {
        const start = toDate(t.createdAt);
        const end = toDate(t.updatedAt);
        if (!start || !end) return null;
        return Math.max(0, end.getTime() - start.getTime());
      })
      .filter((v): v is number => v !== null);

    const avgHours = doneDurations.length
      ? doneDurations.reduce((a, b) => a + b, 0) / doneDurations.length / 3600000
      : 0;
    const fastestHours = doneDurations.length ? Math.min(...doneDurations) / 3600000 : 0;

    const openAges = tasks
      .filter((t) => t.status !== "done")
      .map((t) => {
        const created = toDate(t.createdAt);
        return created ? Date.now() - created.getTime() : null;
      })
      .filter((v): v is number => v !== null);

    const avgOpenDays = openAges.length
      ? openAges.reduce((a, b) => a + b, 0) / openAges.length / 86400000
      : 0;

    return {
      avgHours,
      fastestHours,
      avgOpenDays,
      completedCount: doneDurations.length,
    };
  }, [tasks]);

  const monthlyDone = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return tasks.filter((t) => {
      if (t.status !== "done") return false;
      const end = toDate(t.updatedAt ?? t.createdAt);
      return end?.getMonth() === month && end.getFullYear() === year;
    }).length;
  }, [tasks]);

  const completionRate = useMemo(
    () => (tasks.length ? Math.round((statusStats.done / tasks.length) * 100) : 0),
    [statusStats.done, tasks.length],
  );

  const statusPieData = useMemo(
    () => ({
      labels: ["Done", "In progress", "To do"],
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

  const weeklyBarData = useMemo(
    () => ({
      labels: weeklyActivity.map((d) => d.label),
      datasets: [
        {
          label: "Tao",
          data: weeklyActivity.map((d) => d.created),
          backgroundColor: "rgba(59, 130, 246, 0.6)",
        },
        {
          label: "Hoan thanh",
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

  const sparklinePoints = useMemo(() => {
    const values = weeklyActivity.map((d) => d.done || d.created);
    const width = 140;
    const height = 50;
    const max = Math.max(...values, 1);
    const step = values.length > 1 ? width / (values.length - 1) : 0;
    const points = values.map((v, idx) => {
      const x = idx * step;
      const y = height - (v / max) * (height - 6) - 3;
      return `${x},${y}`;
    });
    return points.join(" ");
  }, [weeklyActivity]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Dashboard"
        subtitle="Tong quan cong viec, trang thai va toc do hoan thanh."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Task hoan thanh</p>
          <p className="text-3xl font-bold text-emerald-600">{statusStats.done}</p>
          <p className="text-sm text-slate-600">Thang nay: {monthlyDone}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Dang lam</p>
          <p className="text-3xl font-bold text-blue-600">{statusStats.in_progress}</p>
          <p className="text-sm text-slate-600">Chua xong, uu tien tiep</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Chua bat dau</p>
          <p className="text-3xl font-bold text-amber-600">{statusStats.todo}</p>
          <p className="text-sm text-slate-600">Tong task: {tasks.length}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Ti le hoan thanh</p>
              <p className="text-3xl font-bold text-slate-900">{completionRate}%</p>
              <p className="text-sm text-slate-600">Tong task: {tasks.length}</p>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Phan bo trang thai">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="min-w-[180px] flex-1">
              <Pie data={statusPieData} options={pieOptions} />
            </div>
            <div className="flex-1 space-y-3">
              {(["done", "in_progress", "todo"] as TaskStatus[]).map((status) => {
                const label = status === "done" ? "Done" : status === "in_progress" ? "In progress" : "To do";
                const color =
                  status === "done"
                    ? "bg-emerald-500"
                    : status === "in_progress"
                      ? "bg-blue-500"
                      : "bg-amber-500";
                const count = statusStats[status];
                const percent = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
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

        <Card title="Hoat dong 7 ngay">
          <div className="space-y-4">
            <Bar data={weeklyBarData} options={barOptions} className="max-h-72" />
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Xu huong hoan thanh</span>
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

        <Card title="Thong ke thoi gian">
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Hoan thanh TB</span>
              <span className="font-semibold text-slate-900">
                {timeStats.avgHours ? `${timeStats.avgHours.toFixed(1)} gio` : "Chua du lieu"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Nhanh nhat</span>
              <span className="font-semibold text-emerald-700">
                {timeStats.fastestHours ? `${timeStats.fastestHours.toFixed(1)} gio` : "Chua du lieu"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Tuoi trung binh task dang mo</span>
              <span className="font-semibold text-blue-700">
                {timeStats.avgOpenDays ? `${timeStats.avgOpenDays.toFixed(1)} ngay` : "Chua du lieu"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Dua tren thoi gian created/updated tu API. Nen cap nhat task de co so lieu chinh xac.
            </p>
          </div>
        </Card>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Dang tai tasks...</p> : null}

      <TaskList tasks={tasks} skillNames={skillNames} />
    </div>
  );
};

export default DashboardPage;
