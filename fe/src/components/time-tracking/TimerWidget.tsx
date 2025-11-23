import Card from "../common/Card";

const TimerWidget = () => {
  return (
    <Card title="Timer">
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl font-semibold text-slate-900">00:25:32</div>
        <div className="flex gap-2">
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
            Start
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Pause
          </button>
          <button className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
            Reset
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Demo only. Wire to real timers later.
        </p>
      </div>
    </Card>
  );
};

export default TimerWidget;
