import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import PageTitle from "../../components/ui/PageTitle";
import CalendarCard from "../../components/shared/CalendarCard";
import { parseDateKey } from "../../lib/dateUtils";
import { useTasks } from "../../hooks/useTasks";
import { useTimerStore } from "../../store/useTimerStore";
import { useTaskUiStore } from "../../store/useTaskUiStore";
import type { Task } from "../../types/task";
import WorkspacePanel from "./components/WorkspacePanel";
import TasksTable from "./components/TasksTable";

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
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [background, setBackground] = useState<BackgroundMedia | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: tasks = [], isLoading: loadingTasks, error: tasksError } = useTasks();
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

  // ── Derived task lists ────────────────────────────────────────────────────

  const tasksForSelectedDay = useMemo(
    () => tasks.filter((task) => !task.dueDate || parseDateKey(task.dueDate) === selectedDate),
    [selectedDate, tasks],
  );

  const orderedTasks = useMemo(
    () => [...tasksForSelectedDay].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)),
    [tasksForSelectedDay],
  );

  const incompleteTasks = useMemo(
    () => orderedTasks.filter((task) => task.status !== "done"),
    [orderedTasks],
  );

  const activeTask = useMemo(
    () => orderedTasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, orderedTasks],
  );

  const displaySeconds =
    mode === "countdown" ? (remaining > 0 ? remaining : requiredSeconds) : elapsed;
  const timeDisplay = formatTime(displaySeconds || 0);

  // ── Side-effects ─────────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const handle = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener("fullscreenchange", handle);
    return () => document.removeEventListener("fullscreenchange", handle);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isFullscreen]);

  useEffect(() => {
    return () => { if (background?.url) URL.revokeObjectURL(background.url); };
  }, [background]);

  // Auto-select first incomplete task
  useEffect(() => {
    if (activeTaskId || !incompleteTasks.length) return;
    const first = incompleteTasks[0];
    selectTask({ id: first.id, title: first.title, requiredMinutes: first.learningMinutes ?? 0 });
  }, [activeTaskId, incompleteTasks, selectTask]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBackground((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { url: URL.createObjectURL(file), kind: file.type.startsWith("video") ? "video" : "image", name: file.name };
    });
    setIsFullscreen(false);
    event.target.value = "";
  };

  const handleSelectTask = (task: Task) => {
    selectTask({ id: task.id, title: task.title, requiredMinutes: task.learningMinutes ?? 0 });
  };

  const handleNextTask = () => {
    if (!incompleteTasks.length) return;
    const idx = incompleteTasks.findIndex((t) => t.id === activeTaskId);
    const target = idx >= 0 ? incompleteTasks[idx + 1] : incompleteTasks[0];
    if (target) handleSelectTask(target);
  };

  const handlePrevTask = () => {
    if (!incompleteTasks.length) return;
    const idx = incompleteTasks.findIndex((t) => t.id === activeTaskId);
    const target = idx > 0 ? incompleteTasks[idx - 1] : null;
    if (target) handleSelectTask(target);
  };

  const handleToggleRun = () => {
    if (!activeTaskId && incompleteTasks[0]) handleSelectTask(incompleteTasks[0]);
    if (isRunning) pause(); else start();
  };

  const canNext = useMemo(() => {
    if (incompleteTasks.length <= 1) return false;
    const idx = incompleteTasks.findIndex((t) => t.id === activeTaskId);
    return idx === -1 || idx < incompleteTasks.length - 1;
  }, [activeTaskId, incompleteTasks]);

  const canPrev = useMemo(() => {
    if (incompleteTasks.length <= 1) return false;
    const idx = incompleteTasks.findIndex((t) => t.id === activeTaskId);
    return idx > 0;
  }, [activeTaskId, incompleteTasks]);

  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
    const target = workspaceRef.current ?? document.documentElement;
    target.requestFullscreen?.().catch(() => undefined);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      <PageTitle
        title="Time Tracking"
        subtitle="Pick a workspace background and switch to fullscreen to focus."
      />

      <WorkspacePanel
        background={background}
        isFullscreen={isFullscreen}
        isRunning={isRunning}
        timeDisplay={timeDisplay}
        activeTaskTitle={activeTask?.title ?? null}
        canNext={canNext}
        canPrev={canPrev}
        onFileChange={handleFileChange}
        onEnterFullscreen={handleEnterFullscreen}
        onExitFullscreen={handleExitFullscreen}
        onToggleRun={handleToggleRun}
        onNext={handleNextTask}
        onPrev={handlePrevTask}
        workspaceRef={workspaceRef}
      />

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <CalendarCard />
        </div>
        <div className="lg:col-span-8">
          <TasksTable
            tasks={orderedTasks}
            activeTaskId={activeTaskId}
            isLoading={loadingTasks}
            error={tasksError}
            onSelectTask={handleSelectTask}
          />
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingPage;
