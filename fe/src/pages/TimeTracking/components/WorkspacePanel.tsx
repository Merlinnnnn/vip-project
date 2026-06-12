import { useRef, type ChangeEvent, type ReactNode } from "react";
import TimerWidget from "./TimerWidget";

type BackgroundMedia = {
  url: string;
  kind: "image" | "video";
  name: string;
};

type Props = {
  background: BackgroundMedia | null;
  isFullscreen: boolean;
  isRunning: boolean;
  timeDisplay: string;
  activeTaskTitle: string | null;
  canNext: boolean;
  canPrev: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onEnterFullscreen: () => void;
  onExitFullscreen: () => void;
  onToggleRun: () => void;
  onNext: () => void;
  onPrev: () => void;
  workspaceRef: React.RefObject<HTMLDivElement | null>;
};

const renderMedia = (background: BackgroundMedia | null, className: string): ReactNode => {
  if (!background) {
    return <div className={className + " bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"} />;
  }
  if (background.kind === "video") {
    return <video className={className} src={background.url} autoPlay loop muted playsInline />;
  }
  return <img className={className} src={background.url} alt={background.name} />;
};

const WorkspacePanel = ({
  background,
  isFullscreen,
  isRunning,
  timeDisplay,
  activeTaskTitle,
  canNext,
  canPrev,
  onFileChange,
  onEnterFullscreen,
  onExitFullscreen,
  onToggleRun,
  onNext,
  onPrev,
  workspaceRef,
}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInfo = background
    ? `${background.kind === "video" ? "Video" : "Image"} - ${background.name}`
    : "No background selected";

  return (
    <>
      {/* Controls bar */}
      <div className="rounded-2xl border border-slate-200 bg-white/60 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Choose background
            </button>
            <button
              onClick={onEnterFullscreen}
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
              onChange={onFileChange}
            />
          </div>
          <span className="text-xs font-medium text-slate-500">{backgroundInfo}</span>
        </div>

        {/* Preview workspace */}
        <div ref={workspaceRef} className="relative mt-2 h-60 overflow-hidden rounded-2xl">
          {renderMedia(background, "absolute inset-0 h-full w-full object-cover")}
          <div className="absolute inset-0 bg-slate-900/45" />
          <div className="relative flex h-full items-center justify-center p-4">
            <div className="w-full max-w-lg drop-shadow-2xl">
              <TimerWidget
                timeDisplay={timeDisplay}
                isRunning={isRunning}
                activeTaskTitle={activeTaskTitle}
                onToggleRun={onToggleRun}
                onNext={onNext}
                onPrev={onPrev}
                canNext={canNext}
                canPrev={canPrev}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50">
          {renderMedia(background, "absolute inset-0 h-full w-full object-cover")}
          <div className="absolute inset-0 bg-slate-900/60" />
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={onExitFullscreen}
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
                activeTaskTitle={activeTaskTitle}
                onToggleRun={onToggleRun}
                onNext={onNext}
                onPrev={onPrev}
                canNext={canNext}
                canPrev={canPrev}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkspacePanel;
