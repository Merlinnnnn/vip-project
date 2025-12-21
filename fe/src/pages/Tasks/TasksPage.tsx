import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { listTasks } from "../../lib/tasksApi";
import { listSkills } from "../../lib/skillsApi";
import { useAuth } from "../../routes/AuthContext";
import { useTasksStore } from "../../store/useTasksStore";
import { useSkillsStore } from "../../store/useSkillsStore";
import { useTaskUiStore } from "../../store/useTaskUiStore";
import TasksHeader from "./components/TasksHeader";
import CalendarCard from "./components/CalendarCard";
import CategoriesCard from "./components/CategoriesCard";
import TaskListCard from "./components/TaskListCard";
import TaskModal from "./components/TaskModal";
import { normalizeTasks } from "./utils/normalize";

const TasksPage = () => {
  const { user, token } = useAuth();
  const { tasks, setTasks } = useTasksStore();
  const { setSkills } = useSkillsStore();
  const { selectedDate } = useTaskUiStore();

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

  const tasksForSelectedDay = useMemo(
    () =>
      tasks
        .filter((t) => !t.scheduledDate || t.scheduledDate === selectedDate)
        .sort((a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER)),
    [tasks, selectedDate],
  );

  const topTasks = useMemo(() => tasksForSelectedDay.slice(0, 5), [tasksForSelectedDay]);

  return (
    <div className="-mx-4 px-4 pb-10">
      <div className="rounded-3xl border border-slate-200 bg-white px-4 pb-8 shadow-xl">
        <TasksHeader />

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-12">
          <section className="space-y-4 lg:col-span-3">
            <CalendarCard />
          </section>

          <section className="space-y-4 lg:col-span-6">
            <TaskListCard tasks={topTasks} />
          </section>

          <section className="space-y-4 lg:col-span-3">
            <CategoriesCard />
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-slate-600">
              <Plus size={16} className="mr-2" />
              Add widget
            </div>
          </section>
        </div>
      </div>

      <TaskModal />
      {loading ? <div className="mt-4 text-sm text-slate-500">Loading tasks...</div> : null}
    </div>
  );
};

export default TasksPage;
