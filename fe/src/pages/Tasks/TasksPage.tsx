import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { listTasks } from "../../lib/tasksApi";
import { listSkills } from "../../lib/skillsApi";
import { useAuth } from "../../routes/AuthContext";
import { useTasksStore } from "../../store/useTasksStore";
import { useSkillsStore } from "../../store/useSkillsStore";
import TasksHeader from "./components/TasksHeader";
import CalendarCard from "./components/CalendarCard";
import CategoriesCard from "./components/CategoriesCard";
import TaskListCard from "./components/TaskListCard";
import TrackingCard from "./components/TrackingCard";
import CommentsCard from "./components/CommentsCard";
import TaskModal from "./components/TaskModal";
import { normalizeTasks } from "./utils/normalize";

const TasksPage = () => {
  const { user, token } = useAuth();
  const { tasks, setTasks } = useTasksStore();
  const { setSkills } = useSkillsStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
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
    };
    void fetch();
  }, [setTasks, token, user]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const data = await listSkills({ userId: user.id, token });
        setSkills(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    void fetch();
  }, [setSkills, token, user]);

  const topTasks = useMemo(() => tasks.slice(0, 5), [tasks]);

  return (
    <div className="-mx-4 bg-[#f6f4ef] px-4 pb-10">
      <TasksHeader />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-3">
          <CalendarCard />
          <CategoriesCard />
        </section>

        <section className="space-y-4 lg:col-span-6">
          <TaskListCard tasks={topTasks} />
          <TrackingCard tasks={topTasks} />
        </section>

        <section className="space-y-4 lg:col-span-3">
          <CommentsCard />
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-slate-600">
            <Plus size={16} className="mr-2" />
            Add widget
          </div>
        </section>
      </div>

      <TaskModal />
      {loading ? <div className="mt-4 text-sm text-slate-500">Loading tasks...</div> : null}
    </div>
  );
};

export default TasksPage;
