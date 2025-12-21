import { Bell, CalendarDays, Clock3, Loader2, Tag, X } from "lucide-react";
import { useAuth } from "../../../routes/AuthContext";
import { useTasksStore } from "../../../store/useTasksStore";
import { useSkillsStore } from "../../../store/useSkillsStore";
import { useTaskUiStore } from "../../../store/useTaskUiStore";
import { createTask } from "../../../lib/tasksApi";
import { ensureDuration } from "../utils/time";
import { addDays, fmtKey } from "../utils/date";
import { normalizeTasks } from "../utils/normalize";
import { buildWeek } from "../utils/week";
import { useMemo, useState } from "react";

type Props = {
  onCreated?: () => void;
};

const TaskModal = ({ onCreated }: Props) => {
  const { user, token } = useAuth();
  const { tasks, setTasks } = useTasksStore();
  const { skills } = useSkillsStore();
  const { modalOpen, setModalOpen, form, updateForm, resetForm, selectedDate, setSelectedDate } = useTaskUiStore();
  const [saving, setSaving] = useState(false);
  const [showWeek, setShowWeek] = useState(false);
  const rollingWeek = useMemo(() => buildWeek(new Date()), []);
  const resolveScheduledDate = () => {
    if (form.dayOption === "none") return null;
    if (form.dayOption === "today") return fmtKey(new Date());
    if (form.dayOption === "tomorrow") return fmtKey(addDays(new Date(), 1));
    return selectedDate;
  };
  const plannedDateKey = resolveScheduledDate();

  if (!modalOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.title.trim() || !user) return;
    try {
      setSaving(true);
      const duration = ensureDuration(form.learningMinutes);
      const scheduledDate = resolveScheduledDate();
      const sameDayTasks = tasks.filter((t) => (t.scheduledDate ?? null) === scheduledDate);
      const nextPriority = sameDayTasks.length + 1;

      const created = await createTask(
        { userId: user.id, token },
        {
          title: form.title.trim(),
          description: form.description.trim() || null,
          status: "todo",
          priority: nextPriority,
          scheduledDate,
          learningMinutes: duration,
          skillId: form.skillId || null,
        },
      );
      const createdWithSchedule = {
        ...created,
        scheduledDate: created.scheduledDate ?? scheduledDate,
        priority: created.priority ?? nextPriority,
      };
      setTasks(normalizeTasks([...tasks, createdWithSchedule]));
      onCreated?.();
      resetForm();
      setModalOpen(false);
    } catch {
      // keep silent UI for now
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays size={16} />
            <input
              className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none"
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
              placeholder="Name of task"
            />
          </div>
          <button onClick={() => setModalOpen(false)} className="rounded-full p-1 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CalendarDays size={14} />
                Day
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWeek((v) => !v)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {showWeek ? "Close week" : "Pick day"}
                </button>
                <button
                  type="button"
                  onClick={() => updateForm({ dayOption: "none" })}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    form.dayOption === "none"
                      ? "border-amber-400 bg-amber-100 text-slate-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  No day
                </button>
              </div>
              <div
                className={`grid overflow-hidden rounded-xl border border-slate-200 bg-white/70 transition-[grid-template-rows,opacity] duration-500 ease-out ${
                  showWeek ? "grid-rows-[1fr] opacity-100 pointer-events-auto" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
              >
                <div className="min-h-0">
                  <div
                    className={`p-2 transition duration-300 ease-out ${
                      showWeek ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                    }`}
                  >
                    <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-slate-500">
                      {rollingWeek.map(({ date, key }) => (
                        <div key={`${key}-label`}>{date.toLocaleDateString("default", { weekday: "short" })}</div>
                      ))}
                    </div>
                    <div className="mt-1 grid grid-cols-7 gap-2">
                      {rollingWeek.map(({ date, key }) => {
                        const picked = selectedDate === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedDate(key);
                              updateForm({ dayOption: "custom" });
                            }}
                            className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                              picked
                                ? "border-amber-500 bg-amber-200 text-slate-900 shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Bell size={14} />
                Notification
              </div>
              <div className="flex flex-wrap gap-2">
                {(["1h", "4h", "none"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateForm({ notifyOption: opt })}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      form.notifyOption === opt
                        ? "border-amber-400 bg-amber-100 text-slate-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt === "1h" ? "In 1 hour" : opt === "4h" ? "In 4 hours" : "+"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Tag size={14} />
                Skill (optional)
              </span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none"
                value={form.skillId}
                onChange={(e) => updateForm({ skillId: e.target.value })}
              >
                <option value="">No skill</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Clock3 size={14} />
                Duration (minutes)
              </span>
              <input
                type="number"
                min={15}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none"
                value={form.learningMinutes}
                onChange={(e) => updateForm({ learningMinutes: Number(e.target.value) || 0 })}
              />
            </label>
          </div>

          <label className="space-y-1 text-xs font-semibold text-slate-600">
            <span>Description</span>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none"
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              placeholder="Notes, context, links..."
            />
          </label>

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <div className="text-xs text-slate-500">
              {plannedDateKey ? `Auto place on ${plannedDateKey}` : "No day selected"}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Creating..." : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
