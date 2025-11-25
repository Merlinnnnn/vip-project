import { useEffect, useMemo, useState } from "react";
import PageTitle from "../../components/common/PageTitle";
import TaskList from "../../components/tasks/TaskList";
import type { Task, TaskStatus } from "../../types/task";
import { createTask, deleteTask, listTasks, updateTask } from "../../lib/tasksApi";
import { useAuth } from "../../routes/AuthContext";

type FormState = {
  title: string;
  description: string;
  status: TaskStatus;
};

const defaultForm: FormState = { title: "", description: "", status: "todo" };

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useMemo(
    () => async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const data = await listTasks();
        setTasks(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      if (!user) {
        setError("Please sign in again.");
        return;
      }
      const created = await createTask({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
      });
      setTasks((prev) => [created, ...prev]);
      setForm(defaultForm);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      if (!user) {
        setError("Please sign in again.");
        return;
      }
      const updated = await updateTask(id, { status });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!user) {
        setError("Please sign in again.");
        return;
      }
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle title="Tasks" subtitle="Manage your personal tasks powered by the Task Service (API)" />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Create task</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Title</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Ship the weekly report"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Notes..."
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
            <div className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {[
                { value: "todo", label: "To do", color: "bg-white text-slate-700 border-slate-200" },
                { value: "in_progress", label: "In progress", color: "bg-blue-50 text-blue-800 border-blue-200" },
                { value: "done", label: "Done", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`flex-1 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                    form.status === opt.value
                      ? `${opt.color} shadow-sm`
                      : "bg-transparent text-slate-600 hover:bg-white"
                  }`}
                  onClick={() => setForm((f) => ({ ...f, status: opt.value as TaskStatus }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : "Create task"}
            </button>
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-rose-500">{error}</p> : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading tasks...</p>
      ) : (
        <TaskList tasks={tasks} onStatusChange={handleStatusChange} onDelete={handleDelete} />
      )}
    </div>
  );
};

export default TasksPage;
