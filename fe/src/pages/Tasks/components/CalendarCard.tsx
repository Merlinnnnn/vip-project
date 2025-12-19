import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtKey, startOfMonthMatrix } from "../utils/date";
import { useTaskUiStore } from "../../../store/useTaskUiStore";

const CalendarCard = () => {
  const { selectedDate, setSelectedDate } = useTaskUiStore();
  const selected = new Date(selectedDate);
  const matrix = startOfMonthMatrix(selected);
  const todayKey = fmtKey(new Date());

  const go = (offset: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + offset);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">
          {selected.toLocaleDateString("default", { month: "long", year: "numeric" })}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <button onClick={() => go(-1)} className="rounded-full p-1 hover:bg-slate-100">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => go(1)} className="rounded-full p-1 hover:bg-slate-100">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
        {matrix.map((day) => {
          const key = fmtKey(day);
          const isToday = key === todayKey;
          const isCurrent = day.getMonth() === selected.getMonth();
          const isPicked = key === selectedDate;
          return (
            <button
              key={key}
              onClick={() => setSelectedDate(key)}
              className={`rounded-lg py-2 text-sm transition ${
                isPicked
                  ? "border border-amber-400 bg-amber-100 font-semibold text-slate-900"
                  : isToday
                  ? "bg-amber-200/70 font-semibold text-slate-900"
                  : isCurrent
                  ? "bg-slate-50 text-slate-800 hover:bg-slate-100"
                  : "text-slate-400"
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarCard;
