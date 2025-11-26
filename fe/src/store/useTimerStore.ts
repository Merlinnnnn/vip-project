import { create } from "zustand";

export type TimerMode = "countup" | "countdown";
export type TimerPhase = "focus" | "break" | "long_break";

export type TimerSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  rounds: number;
  longBreakEvery: number;
};

type TimerState = {
  mode: TimerMode;
  isRunning: boolean;
  elapsed: number;
  remaining: number;
  phase: TimerPhase;
  round: number;
  settings: TimerSettings;
  setMode: (mode: TimerMode) => void;
  setSettings: (partial: Partial<TimerSettings>) => void;
  start: () => void;
  toggle: () => void;
  reset: () => void;
  tick: () => void;
};

const initialSettings: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  rounds: 4,
  longBreakEvery: 4,
};

const focusSeconds = (settings: TimerSettings) => settings.focusMinutes * 60;
const shortBreakSeconds = (settings: TimerSettings) => settings.shortBreakMinutes * 60;
const longBreakSeconds = (settings: TimerSettings) => settings.longBreakMinutes * 60;

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: "countup",
  isRunning: false,
  elapsed: 0,
  remaining: 0,
  phase: "focus",
  round: 1,
  settings: initialSettings,

  setMode: (mode) =>
    set((state) => ({
      mode,
      isRunning: false,
      elapsed: 0,
      remaining: mode === "countdown" ? focusSeconds(state.settings) : 0,
      phase: "focus",
      round: 1,
    })),

  setSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
      remaining:
        state.mode === "countdown"
          ? focusSeconds({ ...state.settings, ...partial })
          : state.remaining,
    })),

  start: () =>
    set((state) => ({
      isRunning: true,
      elapsed: state.mode === "countup" ? 0 : state.elapsed,
      remaining:
        state.mode === "countdown" ? focusSeconds(state.settings) : state.remaining,
      phase: "focus",
      round: 1,
    })),

  toggle: () => set((state) => ({ isRunning: !state.isRunning })),

  reset: () =>
    set((state) => ({
      isRunning: false,
      elapsed: 0,
      remaining: state.mode === "countdown" ? focusSeconds(state.settings) : 0,
      phase: "focus",
      round: 1,
    })),

  tick: () => {
    const state = get();
    if (!state.isRunning) return;

    if (state.mode === "countup") {
      set({ elapsed: state.elapsed + 1 });
      return;
    }

    if (state.remaining > 0) {
      set({ remaining: state.remaining - 1 });
      return;
    }

    // Transition phases when countdown hits zero
    const settings = state.settings;
    if (state.phase === "focus") {
      const nextRound = state.round + 1;
      if (nextRound > settings.rounds) {
        set({ isRunning: false, remaining: 0 });
        return;
      }
      const isLong = nextRound % settings.longBreakEvery === 0;
      set({
        phase: isLong ? "long_break" : "break",
        remaining: isLong ? longBreakSeconds(settings) : shortBreakSeconds(settings),
        round: nextRound,
        isRunning: true,
      });
    } else {
      set({
        phase: "focus",
        remaining: focusSeconds(settings),
        isRunning: true,
      });
    }
  },
}));
