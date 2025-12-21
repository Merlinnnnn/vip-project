import { MoreHorizontal, PlusCircle } from "lucide-react";
import { useSkillsStore } from "../../../store/useSkillsStore";

const CategoriesCard = () => {
  const { skills } = useSkillsStore();
  const formatHours = (minutes: number) => (minutes / 60).toFixed(1).replace(/\\.0$/, "");
  const computePercent = (total: number, target: number) => {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((total / target) * 100));
  };
  const list = skills.slice(0, 5);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-800">
        <span>My categories</span>
        <MoreHorizontal size={16} className="text-slate-400" />
      </div>
      <div className="space-y-3 text-sm text-slate-700">
        {list.map((s) => {
          const done = s.totalMinutes ?? 0;
          const target = s.targetMinutes ?? 0;
          const percent = computePercent(done, target);
          return (
            <div key={s.id} className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatHours(done)}h / {formatHours(target)}h
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-600">{percent}%</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-400 transition-[width] duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-500">
            No skills yet. Add one to track progress.
          </div>
        ) : null}
        <button className="inline-flex items-center gap-2 text-sm font-semibold text-amber-500">
          <PlusCircle size={16} />
          Add more
        </button>
      </div>
    </div>
  );
};

export default CategoriesCard;
