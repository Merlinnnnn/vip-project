import { useMemo } from "react";
import {
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Chart as ChartJS,
  Legend,
  Title,
  Tooltip,
} from "chart.js";
import PageTitle from "../../components/ui/PageTitle";
import TaskList from "../Tasks/components/TaskList";
import HeroProfile from "./components/HeroProfile";
import StatsCards from "./components/StatsCards";
import ActivityChart from "./components/ActivityChart";
import StatusChart from "./components/StatusChart";
import { useTasks } from "../../hooks/useTasks";
import { useSkills, useSkillStats } from "../../hooks/useSkills";
import type { TaskStatus } from "../../types/task";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ─── Helpers ────────────────────────────────────────────────────────────────

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
  new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);

// ─── Component ──────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { data: tasks = [], isLoading, error } = useTasks();
  const { data: skills = [] } = useSkills();
  const { data: stats } = useSkillStats();

  // ── Derived data ──────────────────────────────────────────────────────

  const statusStats = useMemo(
    () =>
      tasks.reduce(
        (acc: Record<TaskStatus, number>, task) => {
          acc[task.status] += 1;
          return acc;
        },
        { todo: 0, in_progress: 0, done: 0, overdue: 0 },
      ),
    [tasks],
  );

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
    skills.forEach((s) => { map[s.id] = s.name; });
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
        // eslint-disable-next-line react-hooks/purity
        return created ? Date.now() - created.getTime() : null;
      })
      .filter((v): v is number => v !== null);

    const avgOpenDays = openAges.length
      ? openAges.reduce((a, b) => a + b, 0) / openAges.length / 86400000
      : 0;

    return { avgHours, fastestHours, avgOpenDays, completedCount: doneDurations.length };
  }, [tasks]);

  const monthlyDone = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (t.status !== "done") return false;
      const end = toDate(t.updatedAt ?? t.createdAt);
      return end?.getMonth() === now.getMonth() && end.getFullYear() === now.getFullYear();
    }).length;
  }, [tasks]);

  const completionRate = useMemo(
    () => (tasks.length ? Math.round((statusStats.done / tasks.length) * 100) : 0),
    [statusStats.done, tasks.length],
  );

  const sparklinePoints = useMemo(() => {
    const values = weeklyActivity.map((d) => d.done || d.created);
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
  }, [weeklyActivity]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageTitle
        title="Dashboard"
        subtitle="Tổng quan công việc, trạng thái và tốc độ hoàn thành."
      />

      {stats && <HeroProfile stats={stats} />}

      <StatsCards
        statusStats={statusStats}
        tasks={tasks}
        monthlyDone={monthlyDone}
        completionRate={completionRate}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusChart
          statusStats={statusStats}
          tasksLength={tasks.length}
          timeStats={timeStats}
        />
        <ActivityChart weeklyActivity={weeklyActivity} sparklinePoints={sparklinePoints} />
      </div>

      {error ? <p className="text-sm text-rose-600">{error.message}</p> : null}
      {isLoading ? <p className="text-sm text-slate-600">Đang tải tasks...</p> : null}

      <TaskList tasks={tasks} skillNames={skillNames} />
    </div>
  );
};

export default DashboardPage;
