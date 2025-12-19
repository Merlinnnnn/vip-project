import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type JSX,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CheckSquare, Circle, Clock3, Loader2, Plus, RotateCcw, Settings2 } from "lucide-react";
import PageTitle from "../../components/common/PageTitle";
import type { Task, TaskStatus } from "../../types/task";
import { createTask, listTasks } from "../../lib/tasksApi";
import { listSkills } from "../../lib/skillsApi";
import { useAuth } from "../../routes/AuthContext";
import { useTasksStore } from "../../store/useTasksStore";
import { useSkillsStore } from "../../store/useSkillsStore";

type FormState = {
  title: string;
  description: string;
  skillId: string;
  learningMinutes: number;
  targetTime: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  status: TaskStatus;
  skillId?: string | null;
  start: Date;
  end: Date;
};

type DragAction =
  | { type: "select"; dayIndex: number; startMinutes: number }
  | { type: "drag"; eventId: string; dayIndex: number; offsetMinutes: number }
  | { type: "resize"; eventId: string; dayIndex: number; edge: "start" | "end" };

const HOURS_START = 8;
const HOURS_END = 20;
const MINUTE_PX = 1;
const STORAGE_KEY = "taskCalendarPositions";
const defaultForm: FormState = { title: "", description: "", skillId: "", learningMinutes: 60, targetTime: "18:00" };

const statusMeta: Record<TaskStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  todo: { label: "Chua lam", color: "text-amber-600", bg: "bg-amber-100", icon: <Circle size={14} /> },
  in_progress: { label: "Dang lam", color: "text-blue-600", bg: "bg-blue-100", icon: <Clock3 size={14} /> },
  done: { label: "Da xong", color: "text-emerald-700", bg: "bg-emerald-100", icon: <CheckSquare size={14} /> },
};

const normalizeTasks = (list: Task[]) => {
  const sorted = [...list].sort(
    (a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER),
  );
  return sorted.map((t, idx) => ({ ...t, priority: idx + 1 }));
};

const startOfWeek = (d: Date) => {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (d: Date, n: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

const fmtKey = (d: Date) => d.toISOString().slice(0, 10);

const minutesSinceStart = (date: Date) => date.getHours() * 60 + date.getMinutes();

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ensureDuration = (learningMinutes?: number) => Math.max(15, Number(learningMinutes) || 60);

const defaultStart = (task: Task) => {
  const base = task.createdAt ? new Date(task.createdAt) : new Date();
  base.setHours(HOURS_START + 1, 0, 0, 0);
  return base.toISOString();
};

const defaultEnd = (startIso: string, learningMinutes?: number) => {
  const duration = ensureDuration(learningMinutes);
  const start = new Date(startIso);
  const end = new Date(start.getTime() + duration * 60000);
  return end.toISOString();
};

const TasksPage = () => {
  const { user, token } = useAuth();
  const { tasks, setTasks } = useTasksStore();
  const { skills, setSkills } = useSkillsStore();

  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Record<TaskStatus, boolean>>({
    todo: true,
    in_progress: true,
    done: true,
  });
  const [form, setForm] = useState<FormState>(defaultForm);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [positions, setPositions] = useState<Record<string, { start: string; end: string }>>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, { start: string; end: string }>) : {};
  });

  const [dragAction, setDragAction] = useState<DragAction | null>(null);
  const [hoverSelection, setHoverSelection] = useState<{ dayIndex: number; start: number; end: number } | null>(
    null,
  );
  const gridRef = useRef<HTMLDivElement | null>(null);

  const weekStart = useMemo(() => startOfWeek(new Date(selectedDate)), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

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

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

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

  const events: CalendarEvent[] = useMemo(() => {
    return tasks
      .filter((t) => statusFilter[t.status])
      .map((task) => {
        const stored = positions[task.id];
        const startIso = stored?.start ?? defaultStart(task);
        const endIso = stored?.end ?? defaultEnd(startIso, task.learningMinutes);
        return {
          id: task.id,
          title: task.title,
          status: task.status,
          skillId: task.skillId,
          start: new Date(startIso),
          end: new Date(endIso),
        };
      });
  }, [positions, statusFilter, tasks]);

  const weekEvents = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    weekDays.forEach((d) => {
      map[fmtKey(d)] = [];
    });
    events.forEach((ev) => {
      const key = fmtKey(ev.start);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events, weekDays]);

  const computeWindowFromForm = useCallback(
    (durationMinutes: number) => {
      const baseDay = new Date(selectedDate);
      const now = new Date();
      const minutes = durationMinutes || ensureDuration(form.learningMinutes);

      if (form.targetTime) {
        const [h, m] = form.targetTime.split(":").map(Number);
        if (!Number.isNaN(h)) {
          const endDate = new Date(baseDay);
          endDate.setHours(h, Number.isNaN(m) ? 0 : m, 0, 0);
          let startDate = new Date(endDate.getTime() - minutes * 60000);

          const earliest = new Date(baseDay);
          earliest.setHours(HOURS_START, 0, 0, 0);
          const latest = new Date(baseDay);
          latest.setHours(HOURS_END, 0, 0, 0);

          if (startDate < earliest) {
            startDate = earliest;
            endDate.setTime(startDate.getTime() + minutes * 60000);
          }
          if (endDate > latest) {
            endDate.setTime(latest.getTime());
            startDate = new Date(endDate.getTime() - minutes * 60000);
          }
          return { start: startDate, end: endDate };
        }
      }

      const startDate = new Date(baseDay);
      const suggestedHour = Math.min(Math.max(now.getHours(), HOURS_START + 1), HOURS_END - 1);
      startDate.setHours(suggestedHour, now.getMinutes() < 30 ? 0 : 30, 0, 0);
      const endDate = new Date(startDate.getTime() + minutes * 60000);
      return { start: startDate, end: endDate };
    },
    [form.learningMinutes, form.targetTime, selectedDate],
  );

  const handleCreate = useCallback(
    async (windowOverride?: { start: Date; end: Date }) => {
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
        const duration = ensureDuration(form.learningMinutes);
        const window = windowOverride ?? computeWindowFromForm(duration);
        const created = await createTask(
          { userId: user.id, token },
          {
            title: form.title.trim(),
            description: form.description.trim() || null,
            status: "todo",
            priority: tasks.length + 1,
            learningMinutes: duration,
            skillId: form.skillId || null,
          },
        );
        const next = normalizeTasks([...tasks, created]);
        setTasks(next);
        setPositions((prev) => ({
          ...prev,
          [created.id]: { start: window.start.toISOString(), end: window.end.toISOString() },
        }));
        setForm(defaultForm);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [
      computeWindowFromForm,
      form.description,
      form.learningMinutes,
      form.skillId,
      form.title,
      setTasks,
      tasks,
      token,
      user,
    ],
  );

  const setEventPosition = (eventId: string, start: Date, end: Date) => {
    setPositions((prev) => ({
      ...prev,
      [eventId]: { start: start.toISOString(), end: end.toISOString() },
    }));
  };

  const minuteFromClientY = (clientY: number, dayIndex: number) => {
    if (!gridRef.current) return HOURS_START * 60;
    const dayColumn = gridRef.current.querySelectorAll<HTMLElement>("[data-day]")[dayIndex];
    if (!dayColumn) return HOURS_START * 60;
    const rect = dayColumn.getBoundingClientRect();
    const y = clamp(clientY - rect.top, 0, rect.height);
    return clamp(Math.round(y / MINUTE_PX) + HOURS_START * 60, HOURS_START * 60, HOURS_END * 60);
  };

  const handleBackgroundMouseDown = (dayIndex: number, e: ReactMouseEvent) => {
    if (e.button !== 0) return;
    const startMinutes = minuteFromClientY(e.clientY, dayIndex);
    setDragAction({ type: "select", dayIndex, startMinutes });
    setHoverSelection({ dayIndex, start: startMinutes, end: startMinutes });
  };

  const handleEventMouseDown = (
    ev: CalendarEvent,
    dayIndex: number,
    e: ReactMouseEvent,
    edge?: "start" | "end",
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (edge) {
      setDragAction({ type: "resize", eventId: ev.id, dayIndex, edge });
      return;
    }
    const startMinutes = minutesSinceStart(ev.start);
    const offset = minuteFromClientY(e.clientY, dayIndex) - startMinutes;
    setDragAction({ type: "drag", eventId: ev.id, dayIndex, offsetMinutes: offset });
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragAction) return;
      if (dragAction.type === "select") {
        const current = minuteFromClientY(e.clientY, dragAction.dayIndex);
        setHoverSelection({
          dayIndex: dragAction.dayIndex,
          start: Math.min(dragAction.startMinutes, current),
          end: Math.max(dragAction.startMinutes, current),
        });
      }
      if (dragAction.type === "drag") {
        const current = minuteFromClientY(e.clientY, dragAction.dayIndex);
        const ev = events.find((x) => x.id === dragAction.eventId);
        if (!ev) return;
        const duration = (ev.end.getTime() - ev.start.getTime()) / 60000;
        const startMinutes = clamp(current - dragAction.offsetMinutes, HOURS_START * 60, HOURS_END * 60);
        const startDate = new Date(addDays(weekStart, dragAction.dayIndex));
        startDate.setHours(0, startMinutes, 0, 0);
        const endDate = new Date(startDate.getTime() + duration * 60000);
        setEventPosition(ev.id, startDate, endDate);
      }
      if (dragAction.type === "resize") {
        const current = minuteFromClientY(e.clientY, dragAction.dayIndex);
        const ev = events.find((x) => x.id === dragAction.eventId);
        if (!ev) return;
        const dayDate = addDays(weekStart, dragAction.dayIndex);
        const newStart = new Date(ev.start);
        const newEnd = new Date(ev.end);
        if (dragAction.edge === "start") {
          newStart.setHours(0, clamp(current, HOURS_START * 60, minutesSinceStart(ev.end) - 15), 0, 0);
          newStart.setFullYear(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
        } else {
          newEnd.setHours(0, clamp(current, minutesSinceStart(ev.start) + 15, HOURS_END * 60), 0, 0);
          newEnd.setFullYear(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
        }
        setEventPosition(ev.id, newStart, newEnd);
      }
    };
    const onUp = () => {
      if (dragAction?.type === "select" && hoverSelection) {
        const dayDate = addDays(weekStart, hoverSelection.dayIndex);
        const startDate = new Date(dayDate);
        startDate.setHours(0, hoverSelection.start, 0, 0);
        const endDate = new Date(dayDate);
        endDate.setHours(0, hoverSelection.end, 0, 0);
        void handleCreate({ start: startDate, end: endDate });
      }
      setDragAction(null);
      setHoverSelection(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragAction, events, hoverSelection, weekStart, handleCreate]);

  const handleQuickSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleCreate();
  };

  const handleJumpToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  const handleNextWeek = () => {
    const next = addDays(new Date(selectedDate), 7);
    setSelectedDate(next.toISOString().slice(0, 10));
  };

  const handlePrevWeek = () => {
    const prev = addDays(new Date(selectedDate), -7);
    setSelectedDate(prev.toISOString().slice(0, 10));
  };

  const plannedDuration = ensureDuration(form.learningMinutes);
  const previewWindow = useMemo(
    () => computeWindowFromForm(plannedDuration),
    [computeWindowFromForm, plannedDuration],
  );
  const previewLabel = formatRange(previewWindow.start, previewWindow.end);

  return (
    <div className="space-y-4">
      <PageTitle title="Tasks" subtitle="Week/day calendar voi drag, resize, chon slot" />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-3">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50 shadow-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,.28),transparent_32%)]" />
            <div className="relative space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-emerald-200/70">Add task</div>
                  <div className="text-lg font-semibold">Launchpad</div>
                  <p className="text-sm text-emerald-100/80">
                    Khong can chon ngay; dat gio muon hoan thanh roi bam tao.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                  <div className="text-[10px] uppercase text-emerald-100/70">Hoan thanh truoc</div>
                  <div className="text-sm font-semibold text-white">{previewLabel}</div>
                </div>
              </div>

              <form onSubmit={handleQuickSave} className="space-y-3">
                <label className="space-y-1 text-xs font-semibold text-emerald-100/80">
                  <span className="block">Tieu de</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-emerald-100/50 focus:border-emerald-300 focus:outline-none"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="VD: Hoc React Query"
                    required
                  />
                </label>

                <label className="space-y-1 text-xs font-semibold text-emerald-100/80">
                  <span className="block">Mo ta nhanh</span>
                  <textarea
                    className="min-h-[64px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-emerald-100/50 focus:border-emerald-300 focus:outline-none"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Diem chinh, checklist, link..."
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs font-semibold text-emerald-100/80">
                    <span className="block">Skill</span>
                    <select
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
                      value={form.skillId}
                      onChange={(e) => setForm((f) => ({ ...f, skillId: e.target.value }))}
                      disabled={skillsLoading}
                    >
                      <option className="bg-slate-900 text-white" value="">Khong gan</option>
                      {skills.map((s) => (
                        <option className="bg-slate-900 text-white" key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-xs font-semibold text-emerald-100/80">
                    <span className="block">Thoi luong (phut)</span>
                    <input
                      type="number"
                      min={15}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-emerald-100/50 focus:border-emerald-300 focus:outline-none"
                      value={form.learningMinutes}
                      onChange={(e) => setForm((f) => ({ ...f, learningMinutes: Number(e.target.value) || 0 }))}
                    />
                  </label>
                </div>

                <label className="space-y-1 text-xs font-semibold text-emerald-100/80">
                  <span className="block">Gio muon xong</span>
                  <input
                    type="time"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-emerald-100/50 focus:border-emerald-300 focus:outline-none"
                    value={form.targetTime}
                    onChange={(e) => setForm((f) => ({ ...f, targetTime: e.target.value }))}
                  />
                </label>

                <div className="flex items-center justify-between text-[11px] text-emerald-100/80">
                  <span>Tu can gio trong ngay, khong can chon date.</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold">
                    <Clock3 size={12} />
                    {plannedDuration}p
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-[1px] hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Plus size={16} />
                    {saving ? "?ang t?o..." : "T?o ngay"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleJumpToday()}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-emerald-50 transition hover:-translate-y-[1px] hover:border-emerald-200/60"
                  >
                    <Settings2 size={14} />
                    ??n h?m nay
                  </button>
                </div>

                <p className="text-[11px] leading-relaxed text-emerald-100/80">
                  Mu?n ??t ??ng ng?y? Th? m?t v?ng tr?n l?ch tu?n r?i k?o/resize ?? tinh ch?nh. Form n?y gi? l?i
                  d? li?u khi b?n th? nhi?u slot kh?c nhau.
                </p>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Settings2 size={16} />
                Filter tr?ng th?i
              </div>
              <button
                type="button"
                onClick={() => void loadTasks()}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:-translate-y-[1px] hover:shadow-sm"
              >
                <RotateCcw size={12} />
                Refresh
              </button>
            </div>
            <div className="space-y-2">
              {(Object.keys(statusMeta) as TaskStatus[]).map((status) => (
                <label
                  key={status}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className={statusMeta[status].color}>{statusMeta[status].icon}</span>
                    {statusMeta[status].label}
                  </span>
                  <input
                    type="checkbox"
                    checked={statusFilter[status]}
                    onChange={(e) =>
                      setStatusFilter((prev) => ({
                        ...prev,
                        [status]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-emerald-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md lg:col-span-9">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:shadow-sm"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:shadow-sm"
              >
                Next
              </button>
              <button
                type="button"
                onClick={handleJumpToday}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:shadow-sm"
              >
                Today
              </button>
            </div>
            {loading ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading
              </span>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#f9fafb]">
            <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-white text-xs font-semibold text-slate-600">
              <div className="px-3 py-2" />
              {weekDays.map((day) => {
                const isToday = fmtKey(day) === fmtKey(new Date());
                return (
                  <div
                    key={fmtKey(day)}
                    className={`px-3 py-2 text-center ${isToday ? "text-emerald-600" : ""}`}
                  >
                    <div className="text-[11px] uppercase tracking-wide">
                      {day.toLocaleDateString("default", { weekday: "short" })}
                    </div>
                    <div className="text-base">{day.getDate()}</div>
                  </div>
                );
              })}
            </div>

            <div
              ref={gridRef}
              className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]"
              style={{ height: `${(HOURS_END - HOURS_START) * 60 * MINUTE_PX}px` }}
            >
              <div className="relative">
                {Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => HOURS_START + i).map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-b border-dashed border-slate-200 text-right text-[10px] text-slate-500"
                    style={{ top: `${(h - HOURS_START) * 60 * MINUTE_PX}px`, height: `${60 * MINUTE_PX}px` }}
                  >
                    <span className="pr-2 pt-1 inline-block">{h}:00</span>
                  </div>
                ))}
              </div>

              {weekDays.map((day, idx) => {
                const dayEvents = weekEvents[fmtKey(day)] ?? [];
                return (
                  <div
                    key={fmtKey(day)}
                    data-day
                    className="relative border-l border-slate-200"
                    onMouseDown={(e) => handleBackgroundMouseDown(idx, e)}
                  >
                    {Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute inset-x-0 border-b border-dashed border-slate-200"
                        style={{ top: `${i * 60 * MINUTE_PX}px`, height: `${60 * MINUTE_PX}px` }}
                      />
                    ))}
                    {dayEvents.map((ev) => {
                      const startMinutes = minutesSinceStart(ev.start);
                      const endMinutes = minutesSinceStart(ev.end);
                      const top = (startMinutes - HOURS_START * 60) * MINUTE_PX;
                      const height = Math.max((endMinutes - startMinutes) * MINUTE_PX, 8);
                      return (
                        <div
                          key={ev.id}
                          className={`group absolute inset-x-1 rounded-md border border-slate-300 bg-white shadow-sm transition hover:shadow-md`}
                          style={{ top, height }}
                          onMouseDown={(e) => handleEventMouseDown(ev, idx, e)}
                        >
                          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-700">
                            <span className={statusMeta[ev.status].color}>{statusMeta[ev.status].icon}</span>
                            <span className="text-[10px] text-slate-500">{ev.skillId ?? ""}</span>
                          </div>
                          <div className="px-2 pb-1 text-sm font-semibold text-slate-900">{ev.title}</div>
                          <div className="px-2 pb-1 text-[10px] text-slate-500">
                            {formatRange(ev.start, ev.end)}
                          </div>
                          <div
                            className="absolute left-0 right-0 top-0 h-1 cursor-n-resize opacity-0 transition group-hover:opacity-60"
                            onMouseDown={(e) => handleEventMouseDown(ev, idx, e, "start")}
                          />
                          <div
                            className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize opacity-0 transition group-hover:opacity-60"
                            onMouseDown={(e) => handleEventMouseDown(ev, idx, e, "end")}
                          />
                        </div>
                      );
                    })}

                    {hoverSelection && hoverSelection.dayIndex === idx ? (
                      <div
                        className="absolute inset-x-1 rounded-md border border-emerald-300 bg-emerald-100/60"
                        style={{
                          top: `${(hoverSelection.start - HOURS_START * 60) * MINUTE_PX}px`,
                          height: `${Math.max(hoverSelection.end - hoverSelection.start, 4) * MINUTE_PX}px`,
                        }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TasksPage;

const formatRange = (start: Date, end: Date) => {
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  return `${start.toLocaleTimeString([], opts)} - ${end.toLocaleTimeString([], opts)}`;
};
