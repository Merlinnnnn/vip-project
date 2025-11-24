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
  const { user, token } = useAuth();
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
        const data = await listTasks({ userId: user.id, token });
        setTasks(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [token, user],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setError("Tiêu đề không được để trống");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      if (!user) {
        setError("Bạn cần đăng nhập lại.");
        return;
      }
      const created = await createTask(
        { userId: user.id, token },
        {
          title: form.title.trim(),
          description: form.description.trim() || null,
          status: form.status,
        },
      );
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
        setError("Bạn cần đăng nhập lại.");
        return;
      }
      const updated = await updateTask({ userId: user.id, token }, id, { status });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!user) {
        setError("Bạn cần đăng nhập lại.");
        return;
      }
      await deleteTask({ userId: user.id, token }, id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle title="Tasks" subtitle="Quản lý công việc cá nhân từ Task Service (API)" />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Tạo task mới</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Tiêu đề</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ví dụ: Hoàn thành báo cáo tuần"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Mô tả</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ghi chú thêm..."
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Trạng thái</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Đang lưu..." : "Tạo task"}
            </button>
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-rose-500">{error}</p> : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Đang tải tasks...</p>
      ) : (
        <TaskList tasks={tasks} onStatusChange={handleStatusChange} onDelete={handleDelete} />
      )}
    </div>
  );
};

export default TasksPage;
