import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useTasks } from "../../hooks/useTasks";
import { useSkills } from "../../hooks/useSkills";
import { useTaskUiStore } from "../../store/useTaskUiStore";
import TasksHeader from "./components/TasksHeader";
import CalendarCard from "./components/CalendarCard";
import CategoriesCard from "./components/CategoriesCard";
import TaskListCard from "./components/TaskListCard";
import TaskModal from "./components/TaskModal";

const TasksPage = () => {
  const { data: tasks = [], isLoading, error } = useTasks();
  useSkills(); // prefetch for modal + categories
  const { selectedDate } = useTaskUiStore();

  const dueKey = (taskDate?: string) =>
    taskDate ? new Date(taskDate).toISOString().slice(0, 10) : "";

  const tasksForSelectedDay = useMemo(
    () =>
      tasks
        .filter((t) => !t.dueDate || dueKey(t.dueDate) === selectedDate)
        .sort(
          (a, b) =>
            (a.priority ?? Number.MAX_SAFE_INTEGER) -
            (b.priority ?? Number.MAX_SAFE_INTEGER),
        ),
    [tasks, selectedDate],
  );

  const topTasks = useMemo(
    () => tasksForSelectedDay.slice(0, 5),
    [tasksForSelectedDay],
  );

  return (
    <div className="-mx-4 px-4 pb-10">
      <div className="rounded-3xl border border-slate-200 bg-white px-4 pb-8 shadow-xl">
        <TasksHeader />

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error.message}
          </div>
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
      {isLoading ? (
        <div className="mt-4 text-sm text-slate-500">Loading tasks...</div>
      ) : null}
    </div>
  );
};

export default TasksPage;
