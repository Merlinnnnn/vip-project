import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Card from "../../components/common/Card";
import PageTitle from "../../components/common/PageTitle";
import TimerWidget from "../../components/time-tracking/TimerWidget";
import CalendarCard from "../Tasks/components/CalendarCard";
import { statusMeta } from "../Tasks/meta";
import { normalizeTasks } from "../Tasks/utils/normalize";
import { useTasksStore } from "../../store/useTasksStore";
import { useTimerStore } from "../../store/useTimerStore";
import { useTaskUiStore } from "../../store/useTaskUiStore";
import { listTasks } from "../../lib/tasksApi";
import { useAuth } from "../../routes/AuthContext";
import type { Task } from "../../types/task";

type BackgroundMedia = {
  url: string;
  kind: "image" | "video";
  name: string;
};

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

const TimeTrackingPage = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [background, setBackground] = useState<BackgroundMedia | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const { user, token } = useAuth();
  const { tasks, setTasks } = useTasksStore();
  const { selectedDate } = useTaskUiStore();
  const {
    activeTaskId,
    elapsed,
    remaining,
    requiredSeconds,
    mode,
    isRunning,
    start,
    pause,
    selectTask,
  } = useTimerStore();

  const backgroundInfo = useMemo(
    () =>
      background
        ? `${background.kind === "video" ? "Video" : "Image"} - ${background.name}`
        : "No background selected",
    [background],
  );

  const dueKey = (date?: string) => (date ? new Date(date).toISOString().slice(0, 10) : "");
  const tasksForSelectedDay = useMemo(
    () => tasks.filter((task) => !task.dueDate || dueKey(task.dueDate) === selectedDate),
    [selectedDate, tasks],
  );

  const orderedTasks = useMemo(() => {
    return [...tasksForSelectedDay].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }, [tasksForSelectedDay]);

  const incompleteTasks = useMemo(
    () => orderedTasks.filter((task) => task.status !== "done"),
    [orderedTasks],
  );

  const activeTask = useMemo(
    () => orderedTasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, orderedTasks],
  );

  const displaySeconds =
    mode === "countdown"
      ? (remaining > 0 ? remaining : requiredSeconds)
      : elapsed;
  const timeDisplay = formatTime(displaySeconds || 0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => undefined);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      if (!active) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isFullscreen]);

  useEffect(() => {
    return () => {
      if (background?.url) {
        URL.revokeObjectURL(background.url);
      }
    };
  }, [background]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const loadTasks = async () => {
      setLoadingTasks(true);
      setTasksError(null);
      try {
        const data = await listTasks({ userId: user.id, token });
        if (active) setTasks(normalizeTasks(data));
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Failed to load tasks";
        setTasksError(message);
      } finally {
        if (active) setLoadingTasks(false);
      }
    };
    void loadTasks();
    return () => {
      active = false;
    };
  }, [setTasks, token, user]);

  useEffect(() => {
    if (activeTaskId || !incompleteTasks.length) return;
    const first = incompleteTasks[0];
    selectTask({
      id: first.id,
      title: first.title,
      requiredMinutes: first.learningMinutes ?? 0,
    });
  }, [activeTaskId, incompleteTasks, selectTask]);

  const triggerPicker = () => inputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBackground((prev) => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      const nextUrl = URL.createObjectURL(file);
      const kind = file.type.startsWith("video") ? "video" : "image";
      return { url: nextUrl, kind, name: file.name };
    });
    setIsFullscreen(false);
    event.target.value = "";
  };

  const handleSelectTask = (task: Task) => {
    selectTask({
      id: task.id,
      title: task.title,
      requiredMinutes: task.learningMinutes ?? 0,
    });
  };

  const handleNextTask = () => {
    if (!incompleteTasks.length) return;
    const idx = incompleteTasks.findIndex((task) => task.id === activeTaskId);
    const target = idx >= 0 ? incompleteTasks[idx + 1] : incompleteTasks[0];
    if (target) {
      handleSelectTask(target);
    }
  };

  const handlePrevTask = () => {
    if (!incompleteTasks.length) return;
    const idx = incompleteTasks.findIndex((task) => task.id === activeTaskId);
    const target = idx > 0 ? incompleteTasks[idx - 1] : null;
    if (target) {
      handleSelectTask(target);
    }
  };

  const handleToggleRun = () => {
    if (!activeTaskId && incompleteTasks[0]) {
      handleSelectTask(incompleteTasks[0]);
    }
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const canNext = useMemo(() => {
    if (incompleteTasks.length <= 1) return false;
    const idx = incompleteTasks.findIndex((task) => task.id === activeTaskId);
    return idx === -1 || idx < incompleteTasks.length - 1;
  }, [activeTaskId, incompleteTasks]);

  const canPrev = useMemo(() => {
    if (incompleteTasks.length <= 1) return false;
    const idx = incompleteTasks.findIndex((task) => task.id === activeTaskId);
    return idx > 0;
  }, [activeTaskId, incompleteTasks]);

  const enterFullscreen = () => {
    setIsFullscreen(true);
    const target = workspaceRef.current ?? document.documentElement;
    target.requestFullscreen?.().catch(() => {
      // ignore if user blocks fullscreen; overlay still works
    });
  };

  const renderMedia = (className: string) => {
    if (!background) {
      return <div className={className + " bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"} />;
    }
    if (background.kind === "video") {
      return (
        <video
          className={className}
          src={background.url}
          autoPlay
          loop
          muted
          playsInline
        />
      );
    }
    return <img className={className} src={background.url} alt={background.name} />;
  };

  return (
    <div className="space-y-4">
      <PageTitle
        title="Time Tracking"
        subtitle="Pick a workspace background and switch to fullscreen to focus."
      />

      <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={triggerPicker}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Choose background
            </button>
            <button
              onClick={enterFullscreen}
              disabled={!background}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Enter fullscreen
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <span className="text-xs font-medium text-slate-500">{backgroundInfo}</span>
        </div>

        <div
          ref={workspaceRef}
          className="relative mt-4 h-80 overflow-hidden rounded-2xl"
        >
          {renderMedia("absolute inset-0 h-full w-full object-cover")}
          <div className="absolute inset-0 bg-slate-900/45" />
          <div className="relative flex h-full items-center justify-center p-4">
            <div className="w-full max-w-lg drop-shadow-2xl">
              <TimerWidget
                timeDisplay={timeDisplay}
                isRunning={isRunning}
                activeTaskTitle={activeTask?.title ?? null}
                onToggleRun={handleToggleRun}
                onNext={handleNextTask}
                onPrev={handlePrevTask}
                canNext={canNext}
                canPrev={canPrev}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <CalendarCard />
        </div>
        <div className="lg:col-span-8">
          <Card title="Tasks">
            {tasksError ? (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {tasksError}
              </div>
            ) : null}
            <div className="overflow-hidden rounded-lg border border-slate-100/70 bg-white/40 backdrop-blur">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-xs uppercase text-slate-500 backdrop-blur">
                  <tr>
                    <th className="px-4 py-2">Task</th>
                    <th className="px-4 py-2">Day</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Est. (min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/60 backdrop-blur">
                  {orderedTasks.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-sm text-slate-500" colSpan={4}>
                        {loadingTasks ? "Loading tasks..." : "No tasks found."}
                      </td>
                    </tr>
                  ) : (
                    orderedTasks.map((task) => {
                      const isActive = task.id === activeTaskId;
                      return (
                        <tr
                          key={task.id}
                          onClick={() => handleSelectTask(task)}
                          className={`cursor-pointer transition ${
                            isActive
                              ? "bg-white text-slate-900 shadow-inner"
                              : "hover:bg-white/70"
                          }`}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {task.title}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${statusMeta[task.status].badge} ${statusMeta[task.status].badgeText} ${statusMeta[task.status].badgeBorder}`}
                            >
                              {statusMeta[task.status].icon}
                              <span>{statusMeta[task.status].label}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {task.learningMinutes ?? "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50">
          {renderMedia("absolute inset-0 h-full w-full object-cover")}
          <div className="absolute inset-0 bg-slate-900/60" />
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={() => {
                setIsFullscreen(false);
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => undefined);
                }
              }}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Exit (Esc)
            </button>
          </div>
          <div className="relative flex h-full items-center justify-center p-6">
            <div className="w-full max-w-lg drop-shadow-2xl">
              <TimerWidget
                timeDisplay={timeDisplay}
                isRunning={isRunning}
                activeTaskTitle={activeTask?.title ?? null}
                onToggleRun={handleToggleRun}
                onNext={handleNextTask}
                onPrev={handlePrevTask}
                canNext={canNext}
                canPrev={canPrev}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingPage;
