import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  DragOverlay,
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
import { listSkills } from "../../lib/skillsApi";
import { useAuth } from "../../routes/AuthContext";
import { useTasksStore } from "../../store/useTasksStore";
import { useSkillsStore } from "../../store/useSkillsStore";
import { useTimerStore, type TimerMode } from "../../store/useTimerStore";

type FormState = {
  title: string;
  description: string;
  skillId: string;
  learningMinutes: number;
};

const defaultForm: FormState = { title: "", description: "", skillId: "", learningMinutes: 0 };

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
  const { skills, setSkills } = useSkillsStore();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const {
    mode,
    setMode,
    isRunning,
    shouldTick,
    elapsed,
    remaining,
    requiredSeconds,
    activeTaskId,
    activeTaskTitle,
    selectTask,
    start,
    pause,
    clearTask,
    resetCurrent,
    tick,
    lastCompletedTaskId,
    clearCompletion,
    settings,
    setSettings,
    pomodoroPhase,
    pomodoroRemaining,
    pomodoroRound,
    pomodoroRunning,
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

  const skillNames = useMemo(() => {
    const map: Record<string, string> = {};
    skills.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [skills]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, tasks],
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

  const loadSkills = useMemo(
    () => async () => {
      if (!user) return;
      try {
        setSkillsLoading(true);
        setError(null);
        const data = await listSkills({ userId: user.id, token });
        setSkills(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSkillsLoading(false);
      }
    },
    [setSkills, token, user],
  );

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    const learningMinutes = Math.max(0, Number(form.learningMinutes) || 0);
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
          status: "todo",
          priority: tasks.filter((t) => t.status !== "done").length + 1,
          learningMinutes,
          skillId: form.skillId || null,
        },
      );
      setTasks(normalizeTasks([...tasks, created]));
      if (form.skillId) {
        void loadSkills();
      }
      setForm((prev) => ({ ...defaultForm, skillId: prev.skillId, learningMinutes: prev.learningMinutes }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!user) {
        setError("You need to log in again.");
        return;
      }
      const targetTask = tasks.find((t) => t.id === id);
      const prev = tasks;
      await deleteTask({ userId: user.id, token }, id);
      removeTask(id);
      const next = normalizeTasks(tasks.filter((t) => t.id !== id));
      setTasks(next);
      if (id === activeTaskId) {
        clearTask();
      }
      await syncChangedPriorities(prev, next);
      if (targetTask?.skillId) {
        void loadSkills();
      }
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

  const handlePauseTimer = () => pause();

  const handleSelectTask = (task: Task) => {
    handlePauseTimer();
    selectTask({ id: task.id, title: task.title, requiredMinutes: task.learningMinutes ?? 0 });
    setError(null);
  };

  const handleStartTimer = async () => {
    if (!selectedTask) {
      setError("Chon task de bat dau dem thoi gian.");
      return;
    }
    if (mode === "countdown" && requiredSeconds === 0) {
      setError("Task nay chua co thoi gian dem nguoc.");
      return;
    }
    if (selectedTask.status === "done") {
      setError("Task da hoan thanh, hay chon task khac.");
      return;
    }
    if (!user) {
      setError("You need to log in again.");
      return;
    }

    try {
      setError(null);
      if (selectedTask.status !== "in_progress") {
        const updated = await updateTask({ userId: user.id, token }, selectedTask.id, { status: "in_progress" });
        const next = normalizeTasks([...tasks.filter((t) => t.id !== selectedTask.id), updated]);
        setTasks(next);
      }
      start();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleResetTimer = () => resetCurrent();

  const taskRemaining = mode === "countdown" ? remaining : Math.max(0, requiredSeconds - elapsed);
  const progressPercent = requiredSeconds
    ? Math.min(100, Math.round(((mode === "countdown" ? requiredSeconds - remaining : elapsed) / requiredSeconds) * 100))
    : 0;
  const isCycleRunning = mode === "pomo" ? pomodoroRunning : isRunning;
  const startLabel = isCycleRunning ? "Dang chay" : elapsed > 0 ? "Resume" : "Start";
  const mainDisplaySeconds = mode === "countdown" ? taskRemaining : elapsed;
  const isBreak = mode === "pomo" && pomodoroPhase !== "focus";

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
    if (!shouldTick) return;
    const interval = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(interval);
  }, [shouldTick, tick]);

  useEffect(() => {
    if (!lastCompletedTaskId) return;
    const taskId = lastCompletedTaskId;
    const target = tasks.find((t) => t.id === taskId);
    clearCompletion();
    if (!target) return;
    if (!user) {
      setError("You need to log in again.");
      return;
    }
    const finalize = async () => {
      try {
        const updated = await updateTask({ userId: user.id, token }, target.id, { status: "done" });
        const next = normalizeTasks([...tasks.filter((t) => t.id !== target.id), updated]);
        setTasks(next);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    void finalize();
  }, [clearCompletion, lastCompletedTaskId, setTasks, tasks, token, user]);

  return (
    <div className="space-y-4">
      <PageTitle title="Tasks" subtitle="Manage tasks with priority and drag & drop" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Task timer</p>
              <h3 className="text-xl font-bold">Dem gio theo task</h3>
              <p className="text-xs text-slate-200/80">
                Click task de nap vao dong ho. Chi duoc chay 1 task tai 1 thoi diem.
              </p>
            </div>
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isCycleRunning ? "bg-emerald-400/20 text-emerald-100" : "bg-white/10 text-slate-200"
              }`}
            >
              {isCycleRunning ? "Dang chay" : "Tam dung"}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {[
                { key: "pomo", label: "Task + Break (Pomodoro)" },
                { key: "task", label: "Task count up" },
                { key: "countdown", label: "Task countdown" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setMode(opt.key as TimerMode)}
                  className={`rounded-full px-3 py-1 transition ${
                    mode === opt.key ? "bg-white text-slate-900 shadow" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white/5 p-6 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent animate-[pulse_6s_ease-in-out_infinite]" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24">
                    <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                    <div className="absolute inset-1 rounded-full border-4 border-emerald-400/60 animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-[14px] rounded-full bg-slate-900 shadow-inner" />
                    <div className="absolute inset-0 flex items-center justify-center text-lg font-bold tracking-widest text-emerald-100">
                      {formatTime(selectedTask ? mainDisplaySeconds : 0)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-white line-clamp-2">
                      {activeTaskTitle ?? "Chua chon task"}
                    </p>
                    <p className="text-xs text-slate-200">
                      Yeu cau: {selectedTask?.learningMinutes ?? 0} phut • Da lam: {formatTime(elapsed)}
                    </p>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-emerald-400 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] uppercase tracking-wide text-emerald-100">
                      Con lai: {formatTime(selectedTask ? taskRemaining : 0)}
                    </p>
                  </div>
                </div>
                {mode === "pomo" ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase tracking-wide">Pomodoro</span>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          isBreak ? "bg-blue-400/20 text-blue-100" : "bg-emerald-400/20 text-emerald-100"
                        }`}
                      >
                        {isBreak ? (pomodoroPhase === "long_break" ? "Long break" : "Break") : "Focus"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-lg font-bold tracking-widest">{formatTime(pomodoroRemaining)}</p>
                      <p className="text-[11px] uppercase tracking-wide text-slate-200">
                        Round {pomodoroRound}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-200">
                      Trong gio nghi, dong ho task tam dung va tu tiep tuc khi het nghi.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleStartTimer()}
                disabled={
                  !selectedTask ||
                  selectedTask.status === "done" ||
                  isCycleRunning ||
                  (mode === "countdown" && requiredSeconds === 0)
                }
                className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-900 shadow hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {startLabel}
              </button>
              <button
                type="button"
                onClick={handlePauseTimer}
                disabled={!selectedTask || (!isRunning && !(mode === "pomo" && pomodoroRunning))}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={handleResetTimer}
                disabled={!selectedTask}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset task timer
              </button>
              <button
                type="button"
                onClick={clearTask}
                disabled={!selectedTask}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Bo chon
              </button>
            </div>

            {mode === "pomo" ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-100">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Cau hinh Pomodoro
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Focus (phut)" value={settings.focusMinutes} onChange={(v) => setSettings({ focusMinutes: v })} />
                  <Field label="Short break" value={settings.shortBreakMinutes} onChange={(v) => setSettings({ shortBreakMinutes: v })} />
                  <Field label="Long break" value={settings.longBreakMinutes} onChange={(v) => setSettings({ longBreakMinutes: v })} />
                  <Field label="Long break every" value={settings.longBreakEvery} onChange={(v) => setSettings({ longBreakEvery: v })} />
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
                <label className="mb-1 block text-xs font-semibold text-slate-600">Skill (optional)</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  value={form.skillId}
                  disabled={skillsLoading}
                  onChange={(e) => setForm((f) => ({ ...f, skillId: e.target.value }))}
                >
                  <option value="">-- No skill --</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
                {skillsLoading ? <p className="mt-1 text-xs text-slate-500">Loading skills...</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Thời gian học (phút)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  value={form.learningMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, learningMinutes: Number(e.target.value) || 0 }))}
                  placeholder="Ví dụ: 90"
                />
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
                <p className="text-xs text-slate-500">Drag to rearrange priority. Click de nap vao dong ho.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {activeTasks.length} tasks
              </span>
            </div>
            <div className="relative mt-4 pl-10">
              <div className="absolute left-[10px] top-0 bottom-0 w-px bg-slate-200" />
              {activeTasks.length === 0 ? (
                <p className="text-sm text-slate-500">No active tasks.</p>
              ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={(e) => {
                        setDraggingId(String(e.active.id));
                        const found = activeTasks.find((t) => t.id === e.active.id);
                        setActiveDragTask(found ?? null);
                      }}
                      onDragEnd={async (evt) => {
                        await handleDragEnd(evt);
                        setActiveDragTask(null);
                      }}
                      onDragCancel={() => {
                        setDraggingId(null);
                        setActiveDragTask(null);
                      }}
                    >
                      <SortableContext items={activeTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3 pb-3">
                          {activeTasks.map((task) => (
                            <SortableTaskCard
                              key={task.id}
                              task={task}
                              onSelect={handleSelectTask}
                              onDelete={handleDelete}
                              draggingId={draggingId}
                              skillNames={skillNames}
                              selectedId={activeTaskId}
                              isRunningTask={isRunning}
                            />
                          ))}
                        </div>
                      </SortableContext>
                      <DragOverlay dropAnimation={null}>
                        {activeDragTask ? (
                          <SortableTaskCard
                            task={activeDragTask}
                            onSelect={() => {}}
                            onDelete={handleDelete}
                            draggingId={draggingId}
                            skillNames={skillNames}
                            isOverlay
                            selectedId={activeTaskId}
                            isRunningTask={isRunning}
                          />
                        ) : null}
                      </DragOverlay>
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
                        {task.skillId || task.learningMinutes ? (
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            {task.skillId ? `Skill: ${skillNames[task.skillId] ?? task.skillId}` : null}
                            {task.skillId && task.learningMinutes ? " • " : null}
                            {task.learningMinutes ? `${task.learningMinutes} phút` : null}
                          </p>
                        ) : null}
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Priority: {task.priority ?? "-"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          Done
                        </span>
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
  onSelect: (task: Task) => void;
  onDelete: (id: string) => void;
  isOverlay?: boolean;
  skillNames?: Record<string, string>;
  selectedId?: string | null;
  isRunningTask?: boolean;
};

const SortableTaskCard = ({
  task,
  draggingId,
  onSelect,
  onDelete,
  isOverlay,
  skillNames,
  selectedId,
  isRunningTask,
}: SortableTaskProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: isOverlay,
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
  const skillLabel = task.skillId ? skillNames?.[task.skillId] ?? task.skillId : null;
  const learning = task.learningMinutes ?? 0;
  const isSelected = selectedId === task.id;
  const isLive = Boolean(isSelected && isRunningTask);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={isOverlay ? undefined : () => onSelect(task)}
      className={`group relative w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm transition ${
        draggingId === task.id || isDragging
          ? "ring-2 ring-blue-300 shadow-md"
          : isSelected
            ? "border-emerald-300 ring-2 ring-emerald-300/60"
            : "hover:border-emerald-200"
      } ${isOverlay ? "cursor-grabbing" : "cursor-pointer"}`}
    >
      <div
        className={`absolute left-[-37px] top-2 h-3 w-3 rounded-full border-2 shadow-sm ${bulletColor}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-slate-900">{task.title}</p>
          {task.description ? <p className="text-xs text-slate-600">{task.description}</p> : null}
          {skillLabel || learning ? (
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              {skillLabel ? `Skill: ${skillLabel}` : null}
              {skillLabel && learning ? " • " : null}
              {learning ? `${learning} phút` : null}
            </p>
          ) : null}
          {/* <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Priority: {task.priority ?? "-"}
          </p> */}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              isLive ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-700"
            }`}
          >
            {isLive ? "Dang chay" : statusLabel(task.status)}
          </span>
          <p className="text-[11px] text-slate-500">Click de nap vao dong ho.</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
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
