import { create } from "zustand";

export type TimerMode = "task" | "countdown" | "pomo";
export type PomodoroPhase = "focus" | "break" | "long_break";

type TimerSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
};

type TaskTimerPayload = {
  id: string;
  title?: string | null;
  requiredMinutes?: number | null;
};

type TimerState = {
  mode: TimerMode;
  isRunning: boolean; // task timer running (only during focus in pomo)
  shouldTick: boolean; // drive interval
  elapsed: number; // task elapsed
  remaining: number; // task remaining for countdown
  requiredSeconds: number;
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  progressByTask: Record<string, number>;
  lastCompletedTaskId: string | null;
  settings: TimerSettings;
  pomodoroPhase: PomodoroPhase;
  pomodoroRemaining: number;
  pomodoroRound: number;
  pomodoroRunning: boolean;
  setMode: (mode: TimerMode) => void;
  setSettings: (partial: Partial<TimerSettings>) => void;
  selectTask: (payload: TaskTimerPayload) => void;
  start: () => void;
  pause: () => void;
  clearTask: () => void;
  resetCurrent: () => void;
  clearCompletion: () => void;
  tick: () => void;
};

const toSeconds = (minutes?: number | null) => Math.max(0, Math.floor((minutes ?? 0) * 60));
const focusSeconds = (settings: TimerSettings) => toSeconds(settings.focusMinutes);
const shortBreakSeconds = (settings: TimerSettings) => toSeconds(settings.shortBreakMinutes);
const longBreakSeconds = (settings: TimerSettings) => toSeconds(settings.longBreakMinutes);

const initialSettings: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
};

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: "task",
  isRunning: false,
  shouldTick: false,
  elapsed: 0,
  remaining: 0,
  requiredSeconds: 0,
  activeTaskId: null,
  activeTaskTitle: null,
  progressByTask: {},
  lastCompletedTaskId: null,
  settings: initialSettings,
  pomodoroPhase: "focus",
  pomodoroRemaining: focusSeconds(initialSettings),
  pomodoroRound: 1,
  pomodoroRunning: false,

  setMode: (mode) =>
    set((state) => {
      const base = {
        mode,
        isRunning: false,
        shouldTick: false,
        lastCompletedTaskId: null,
      };
      if (mode === "countdown") {
        return {
          ...state,
          ...base,
          remaining: state.requiredSeconds,
        };
      }
      if (mode === "pomo") {
        return {
          ...state,
          ...base,
          pomodoroPhase: "focus",
          pomodoroRemaining: focusSeconds(state.settings),
          pomodoroRound: 1,
          pomodoroRunning: false,
        };
      }
      return {
        ...state,
        ...base,
      };
    }),

  setSettings: (partial) =>
    set((state) => {
      const nextSettings = { ...state.settings, ...partial };
      return {
        settings: nextSettings,
        pomodoroRemaining:
          state.mode === "pomo" && state.pomodoroPhase === "focus"
            ? focusSeconds(nextSettings)
            : state.mode === "pomo" && state.pomodoroPhase === "break"
              ? shortBreakSeconds(nextSettings)
              : state.mode === "pomo" && state.pomodoroPhase === "long_break"
                ? longBreakSeconds(nextSettings)
                : state.pomodoroRemaining,
      };
    }),

  selectTask: ({ id, title, requiredMinutes }) => {
    const duration = toSeconds(requiredMinutes);
    const savedProgress = get().progressByTask[id] ?? 0;
    const elapsed = Math.min(savedProgress, duration || Number.MAX_SAFE_INTEGER);
    set((state) => ({
      activeTaskId: id,
      activeTaskTitle: title ?? null,
      requiredSeconds: duration,
      elapsed,
      remaining: state.mode === "countdown" ? Math.max(0, duration - elapsed) : state.remaining,
      isRunning: false,
      shouldTick: false,
      pomodoroPhase: "focus",
      pomodoroRemaining: focusSeconds(state.settings),
      pomodoroRound: 1,
      pomodoroRunning: false,
      lastCompletedTaskId: null,
    }));
  },

  start: () => {
    const state = get();
    if (!state.activeTaskId) return;

    if (state.mode === "task") {
      set({ isRunning: true, shouldTick: true });
      return;
    }

    if (state.mode === "countdown") {
      const remaining = state.remaining > 0 ? state.remaining : state.requiredSeconds;
      if (remaining <= 0) {
        set({
          remaining: 0,
          lastCompletedTaskId: state.activeTaskId,
          isRunning: false,
          shouldTick: false,
        });
        return;
      }
      set({
        remaining,
        isRunning: true,
        shouldTick: true,
      });
      return;
    }

    // pomodoro
    const nextRemaining = state.pomodoroRemaining || focusSeconds(state.settings);
    const inFocus = state.pomodoroPhase === "focus";
    set({
      pomodoroRemaining: nextRemaining,
      pomodoroRunning: true,
      isRunning: inFocus,
      shouldTick: true,
    });
  },

  pause: () =>
    set((state) => ({
      isRunning: false,
      pomodoroRunning: state.mode === "pomo" ? false : state.pomodoroRunning,
      shouldTick: false,
    })),

  clearTask: () =>
    set((state) => ({
      mode: state.mode,
      isRunning: false,
      shouldTick: false,
      elapsed: 0,
      remaining: 0,
      requiredSeconds: 0,
      activeTaskId: null,
      activeTaskTitle: null,
      pomodoroPhase: "focus",
      pomodoroRemaining: focusSeconds(state.settings),
      pomodoroRound: 1,
      pomodoroRunning: false,
      lastCompletedTaskId: null,
    })),

  resetCurrent: () => {
    const id = get().activeTaskId;
    set((state) => ({
      isRunning: false,
      shouldTick: false,
      elapsed: 0,
      remaining: state.mode === "countdown" ? state.requiredSeconds : 0,
      pomodoroPhase: "focus",
      pomodoroRemaining: focusSeconds(state.settings),
      pomodoroRound: 1,
      pomodoroRunning: false,
      progressByTask: id ? { ...state.progressByTask, [id]: 0 } : state.progressByTask,
      lastCompletedTaskId: null,
    }));
  },

  clearCompletion: () => set({ lastCompletedTaskId: null }),

  tick: () => {
    const state = get();
    const taskId = state.activeTaskId;
    if (!taskId) return;

    if (state.mode === "task") {
      if (!state.isRunning) return;
      const nextElapsed = state.elapsed + 1;
      const finished = state.requiredSeconds > 0 && nextElapsed >= state.requiredSeconds;
      set((prev) => ({
        elapsed: nextElapsed,
        progressByTask: { ...prev.progressByTask, [taskId]: nextElapsed },
        isRunning: finished ? false : prev.isRunning,
        shouldTick: finished ? false : prev.shouldTick,
        lastCompletedTaskId: finished ? taskId : prev.lastCompletedTaskId,
      }));
      return;
    }

    if (state.mode === "countdown") {
      if (!state.isRunning || state.remaining <= 0) return;
      const nextRemaining = Math.max(0, state.remaining - 1);
      const nextElapsed = state.elapsed + 1;
      const finished = nextRemaining <= 0;
      set((prev) => ({
        remaining: nextRemaining,
        elapsed: nextElapsed,
        progressByTask: { ...prev.progressByTask, [taskId]: nextElapsed },
        isRunning: finished ? false : prev.isRunning,
        shouldTick: finished ? false : prev.shouldTick,
        lastCompletedTaskId: finished ? taskId : prev.lastCompletedTaskId,
      }));
      return;
    }

    // pomodoro
    if (!state.pomodoroRunning || state.pomodoroRemaining <= 0) return;
    const isFocus = state.pomodoroPhase === "focus";
    const nextPomodoroRemaining = state.pomodoroRemaining - 1;
    const nextElapsed = isFocus && state.isRunning ? state.elapsed + 1 : state.elapsed;
    const taskFinished = state.requiredSeconds > 0 && nextElapsed >= state.requiredSeconds;

    // if task finished, stop everything
    if (taskFinished) {
      set((prev) => ({
        elapsed: nextElapsed,
        remaining: Math.max(0, state.requiredSeconds - nextElapsed),
        progressByTask: { ...prev.progressByTask, [taskId]: nextElapsed },
        isRunning: false,
        pomodoroRunning: false,
        shouldTick: false,
        lastCompletedTaskId: taskId,
      }));
      return;
    }

    if (nextPomodoroRemaining > 0) {
      set((prev) => ({
        pomodoroRemaining: nextPomodoroRemaining,
        elapsed: nextElapsed,
        progressByTask: isFocus
          ? { ...prev.progressByTask, [taskId]: nextElapsed }
          : prev.progressByTask,
      }));
      return;
    }

    // Transition to next phase
    const settings = state.settings;
    if (isFocus) {
      const nextRound = state.pomodoroRound + 1;
      const isLong = nextRound % settings.longBreakEvery === 0;
      set((prev) => ({
        pomodoroPhase: isLong ? "long_break" : "break",
        pomodoroRemaining: isLong ? longBreakSeconds(settings) : shortBreakSeconds(settings),
        pomodoroRound: nextRound,
        isRunning: false,
        pomodoroRunning: true,
        shouldTick: true,
        elapsed: nextElapsed,
        progressByTask: { ...prev.progressByTask, [taskId]: nextElapsed },
      }));
    } else {
      set({
        pomodoroPhase: "focus",
        pomodoroRemaining: focusSeconds(settings),
        isRunning: true,
        pomodoroRunning: true,
        shouldTick: true,
        elapsed: nextElapsed,
      });
    }
  },
}));
