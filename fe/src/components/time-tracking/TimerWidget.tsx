type Props = {
  timeDisplay: string;
  isRunning: boolean;
  activeTaskTitle?: string | null;
  onToggleRun: () => void;
  onNext: () => void;
  onPrev: () => void;
  canNext: boolean;
  canPrev: boolean;
};

const TimerWidget = ({
  timeDisplay,
  isRunning,
  activeTaskTitle,
  onToggleRun,
  onNext,
  onPrev,
  canNext,
  canPrev,
}: Props) => {
  return (
    <div className="flex flex-col items-center gap-6 text-white drop-shadow-xl">
      {activeTaskTitle ? (
        <p className="text-xs uppercase tracking-[0.25em] text-white/70">
          {activeTaskTitle}
        </p>
      ) : (
        <p className="text-xs uppercase tracking-[0.25em] text-white/50">No task</p>
      )}
      <div className="text-6xl font-black tracking-[0.14em] text-white/95 drop-shadow-[0_10px_25px_rgba(0,0,0,0.45)]">
        {timeDisplay}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="group inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 shadow-lg shadow-black/30 transition duration-150 hover:scale-105 hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-[3px]">
            <span className="inline-block border-y-[8px] border-y-transparent border-r-[12px] border-r-white/70"></span>
            <span className="inline-block border-y-[8px] border-y-transparent border-r-[12px] border-r-white/90"></span>
          </span>
        </button>
        <button
          onClick={onToggleRun}
          className="group inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10 shadow-lg shadow-black/35 transition duration-150 hover:scale-110 hover:bg-white/15 active:scale-95"
        >
          {isRunning ? (
            <span className="h-4 w-4 rounded-[7px] bg-white/85" />
          ) : (
            <span className="inline-block border-y-[10px] border-y-transparent border-l-[16px] border-l-white/90"></span>
          )}
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="group inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 shadow-lg shadow-black/30 transition duration-150 hover:scale-105 hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-[3px]">
            <span className="inline-block border-y-[8px] border-y-transparent border-l-[12px] border-l-white/90"></span>
            <span className="inline-block border-y-[8px] border-y-transparent border-l-[12px] border-l-white/70"></span>
          </span>
        </button>
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Focus mode</p>
    </div>
  );
};

export default TimerWidget;
