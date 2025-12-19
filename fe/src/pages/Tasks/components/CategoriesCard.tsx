import { MoreHorizontal, PlusCircle } from "lucide-react";
import { useSkillsStore } from "../../../store/useSkillsStore";

const CategoriesCard = () => {
  const { skills } = useSkillsStore();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-800">
        <span>My categories</span>
        <MoreHorizontal size={16} className="text-slate-400" />
      </div>
      <div className="space-y-2 text-sm text-slate-700">
        {skills.slice(0, 4).map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <span>{s.name}</span>
            <div className="flex items-center -space-x-2">
              <span className="h-6 w-6 rounded-full bg-amber-200" />
              <span className="h-6 w-6 rounded-full bg-emerald-200" />
            </div>
          </div>
        ))}
        <button className="inline-flex items-center gap-2 text-sm font-semibold text-amber-500">
          <PlusCircle size={16} />
          Add more
        </button>
      </div>
    </div>
  );
};

export default CategoriesCard;
