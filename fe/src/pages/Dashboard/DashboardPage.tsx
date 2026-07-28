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
import SessionStatsCards from "./components/SessionStatsCards";
import SkillDistributionChart from "./components/SkillDistributionChart";
import { useTasks } from "../../hooks/useTasks";
import { useSkills, useSkillStats } from "../../hooks/useSkills";
import { useSessionStats } from "../../hooks/useWorkSessions";
import type { TaskStatus } from "../../types/task";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ─── Helpers ────────────────────────────────────────────────────────────────

const toDate = (input?: string) => {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
};

// ─── Component ──────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { data: tasks = [], isLoading, error } = useTasks();
  const { data: skills = [] } = useSkills();
  const { data: stats } = useSkillStats();
  const { data: sessionStats } = useSessionStats();

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

  const skillNames = useMemo(() => {
    const map: Record<string, string> = {};
    skills.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [skills]);


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

      {sessionStats && <SessionStatsCards stats={sessionStats} />}

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusChart
          statusStats={statusStats}
          tasksLength={tasks.length}
        />
        {sessionStats && <ActivityChart dailyHeatmap={sessionStats.dailyHeatmap} />}
        {sessionStats && <SkillDistributionChart bySkill={sessionStats.bySkill} />}
      </div>

      {error ? <p className="text-sm text-rose-600">{error.message}</p> : null}
      {isLoading ? <p className="text-sm text-slate-600">Đang tải tasks...</p> : null}

      <TaskList tasks={tasks} skillNames={skillNames} />
    </div>
  );
};

export default DashboardPage;
