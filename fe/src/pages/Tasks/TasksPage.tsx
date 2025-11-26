import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PageTitle from "../../components/common/PageTitle";
import type { Task, TaskStatus } from "../../types/task";
import { createTask, deleteTask, listTasks, updateTask } from "../../lib/tasksApi";
import { useAuth } from "../../routes/AuthContext";
import { useTasksStore } from "../../store/useTasksStore";
import { useTimerStore } from "../../store/useTimerStore";

type FormState = {
  title: string;
  description: string;
  status: TaskStatus;
};

const defaultForm: FormState = { title: "", description: "", status: "todo" };

const statusLabel = (status: TaskStatus) =>
  status === "in_progress" ? "In progress" : status === "done" ? "Done" : "To do";

const normalizeTasks = (list: Task[]) => {
  const sorted = [...list].sort(
    (a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER),
  );
  return sorted.map((t, idx) => ({ ...t, priority: idx + 1 }));
};

const TasksPage = () => {
  const { user, token } = useAuth();
  const { tasks, setTasks, removeTask } = useTasksStore();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const {
    mode: timerMode,
    isRunning,
    elapsed,
    remaining,
    phase: currentPhase,
    round,
    settings,
    setMode,
    setSettings,
    start,
    toggle,
    reset,
    tick,
  } = useTimerStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const syncChangedPriorities = async (previous: Task[], next: Task[]) => {
    if (!user) return;
    const prevMap = new Map(previous.map((t) => [t.id, t.priority]));
    const changed = next.filter((t) => prevMap.get(t.id) !== t.priority);
    if (!changed.length) return;
    await Promise.all(
      changed.map((t) => updateTask({ userId: user.id, token }, t.id, { priority: t.priority })),
    );
  };

  const activeTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "done")
        .sort((a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER)),
    [tasks],
  );

  const doneTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "done")
        .sort((a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER)),
    [tasks],
  );

  const load = useMemo(
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
        setError("You need to log in again.");
        return;
      }
      const created = await createTask(
        { userId: user.id, token },
        {
          title: form.title.trim(),
          description: form.description.trim() || null,
          status: form.status,
          priority: tasks.filter((t) => t.status !== "done").length + 1,
        },
      );
      setTasks(normalizeTasks([...tasks, created]));
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
        setError("You need to log in again.");
        return;
      }
      const prev = tasks;
      const updated = await updateTask({ userId: user.id, token }, id, { status });
      const next = normalizeTasks([...tasks.filter((t) => t.id !== id), updated]);
      setTasks(next);
      await syncChangedPriorities(prev, next);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!user) {
        setError("You need to log in again.");
        return;
      }
      const prev = tasks;
      await deleteTask({ userId: user.id, token }, id);
      removeTask(id);
      const next = normalizeTasks(tasks.filter((t) => t.id !== id));
      setTasks(next);
      await syncChangedPriorities(prev, next);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const persistOrder = async (ordered: Task[]) => {
    if (!user) {
      setError("You need to log in again.");
      return;
    }
    const reordered = ordered.map((task, idx) => ({ ...task, priority: idx + 1 }));
    const newList = normalizeTasks([...reordered, ...doneTasks]);
    setTasks(newList);

    const changedActiveIds = new Set(reordered.map((t) => t.id));
    const payload = newList.filter((t) => changedActiveIds.has(t.id));
    try {
      await Promise.all(
        payload.map((task) => updateTask({ userId: user.id, token }, task.id, { priority: task.priority })),
      );
    } catch (err) {
      setError((err as Error).message);
      void load();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);
    if (!over) return;
    if (active.id === over.id) return;
    const oldIndex = activeTasks.findIndex((t) => t.id === active.id);
    const newIndex = activeTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(activeTasks, oldIndex, newIndex);
    await persistOrder(reordered);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleCreate();
  };

  // Timer handlers
  const formatTime = (totalSeconds: number) => {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(sec / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, tick]);

  return (
    <div className="space-y-4">
      <PageTitle title="Tasks" subtitle="Manage tasks with priority and drag & drop" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Timer</p>
                <h3 className="text-xl font-bold">Focus / Break</h3>
              </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              {timerMode === "countup" ? "Count up" : "Pomodoro"}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-white/5 p-6 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent animate-[pulse_4s_ease-in-out_infinite]" />
              <div className="relative flex items-center gap-4">
                <div className="relative h-24 w-24">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                  <div className="absolute inset-1 rounded-full border-4 border-emerald-400/60 animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-[14px] rounded-full bg-slate-900 shadow-inner" />
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold tracking-widest text-emerald-100">
                    {timerMode === "countup" ? formatTime(elapsed) : formatTime(remaining)}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-200">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        currentPhase === "focus"
                          ? "bg-emerald-500/20 text-emerald-100"
                          : "bg-blue-500/20 text-blue-100"
                      }`}
                    >
                      {timerMode === "countup"
                        ? "Free run"
                        : currentPhase === "focus"
                          ? `Focus - Round ${round}/${settings.rounds}`
                          : currentPhase === "long_break"
                            ? "Long break"
                            : "Short break"}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-slate-100">
                      {timerMode === "countdown"
                        ? `${settings.focusMinutes}m - ${settings.shortBreakMinutes}m SB`
                        : "00:00:00"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("countup")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        timerMode === "countup"
                          ? "bg-white text-slate-900 shadow"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      Count up
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("countdown")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        timerMode === "countdown"
                          ? "bg-white text-slate-900 shadow"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      Pomodoro
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (timerMode === "countup") {
                          if (!isRunning && elapsed === 0) start();
                          else toggle();
                        } else {
                          if (!isRunning && remaining === 0) start();
                          else toggle();
                        }
                      }}
                      className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-900 shadow hover:bg-emerald-300"
                    >
                      {isRunning ? "Pause" : "Start"}
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {timerMode === "countdown" ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-100">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Pomodoro settings
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Focus (minutes)"
                    value={settings.focusMinutes}
                    onChange={(v) => setSettings({ focusMinutes: v })}
                  />
                  <Field
                    label="Short break"
                    value={settings.shortBreakMinutes}
                    onChange={(v) => setSettings({ shortBreakMinutes: v })}
                  />
                  <Field
                    label="Long break"
                    value={settings.longBreakMinutes}
                    onChange={(v) => setSettings({ longBreakMinutes: v })}
                  />
                  <Field
                    label="Rounds"
                    value={settings.rounds}
                    onChange={(v) => setSettings({ rounds: v })}
                  />
                  <Field
                    label="Long break every"
                    value={settings.longBreakEvery}
                    onChange={(v) => setSettings({ longBreakEvery: v })}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800"
        >
          <span>Create a new task</span>
          <span className="text-xs text-emerald-600">{showForm ? "Hide" : "Show"}</span>
        </button>
        <Collapsible open={showForm}>
          <div className="border-t border-slate-100 px-4 pb-4">
            <form onSubmit={handleSubmit} className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Title</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Finish weekly report"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Add some notes..."
                  rows={2}
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
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Create task"}
                </button>
              </div>
            </form>
            {error ? <p className="mt-2 text-sm text-rose-500">{error}</p> : null}
          </div>
        </Collapsible>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading tasks...</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Active</p>
                <h3 className="text-base font-bold text-slate-900">In progress / To do</h3>
                <p className="text-xs text-slate-500">Drag to rearrange priority</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {activeTasks.length} tasks
              </span>
            </div>
            <div className="relative mt-4 pl-10">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
              {activeTasks.length === 0 ? (
                <p className="text-sm text-slate-500">No active tasks.</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={(e) => setDraggingId(String(e.active.id))}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={activeTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3 pb-3">
                      {activeTasks.map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                          draggingId={draggingId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Done</p>
                <h3 className="text-base font-bold text-slate-900">Completed</h3>
                <p className="text-xs text-slate-500">Completed items (no drag)</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {doneTasks.length} tasks
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {doneTasks.length === 0 ? (
                <p className="text-sm text-slate-500">No completed tasks.</p>
              ) : (
                doneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition hover:border-emerald-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-slate-900 line-through decoration-emerald-500">
                          {task.title}
                        </p>
                        {task.description ? (
                          <p className="text-xs text-slate-600">{task.description}</p>
                        ) : null}
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Priority: {task.priority ?? "-"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          Done
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(task.id, "in_progress")}
                            className="rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(task.id)}
                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  </div>
  );
};

export default TasksPage;

type SortableTaskProps = {
  task: Task;
  draggingId: string | null;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
};

const SortableTaskCard = ({
  task,
  draggingId,
  onStatusChange,
  onDelete,
}: SortableTaskProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const bulletColor =
    task.status === "done"
      ? "bg-emerald-500 border-emerald-500"
      : task.status === "in_progress"
        ? "bg-blue-500 border-blue-500"
        : "bg-white border-slate-300";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm transition ${
        draggingId === task.id || isDragging ? "ring-2 ring-blue-300 shadow-md" : "hover:border-emerald-200"
      }`}
    >
      <div
        className={`absolute left-[10px] top-2 h-3 w-3 rounded-full border-2 shadow-sm ${bulletColor}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-slate-900">{task.title}</p>
          {task.description ? <p className="text-xs text-slate-600">{task.description}</p> : null}
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Priority: {task.priority ?? "-"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
            {statusLabel(task.status)}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onStatusChange(task.id, "in_progress")}
              className="rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100"
            >
              Mark doing
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(task.id, "done")}
              className="rounded-lg bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
            >
              Mark done
            </button>
          </div>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

type FieldProps = { label: string; value: number; onChange: (v: number) => void };

const Field = ({ label, value, onChange }: FieldProps) => (
  <label className="space-y-1 text-[11px] font-semibold text-slate-200">
    <span className="block">{label}</span>
    <input
      type="number"
      min={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-300 focus:border-emerald-300 focus:outline-none"
    />
  </label>
);

const Collapsible = ({ open, children }: { open: boolean; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (ref.current) {
      setHeight(ref.current.scrollHeight);
    }
  }, [children]);

  return (
    <div
      style={{
        maxHeight: open ? height : 0,
        opacity: open ? 1 : 0,
        overflow: "hidden",
        transition: "max-height 220ms ease, opacity 220ms ease",
      }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
};
