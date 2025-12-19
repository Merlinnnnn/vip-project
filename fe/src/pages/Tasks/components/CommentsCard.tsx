import { MoreHorizontal, PlusCircle } from "lucide-react";

const CommentsCard = () => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-800">New comments</div>
        <MoreHorizontal size={18} className="text-slate-400" />
      </div>
      <div className="space-y-3 text-sm text-slate-700">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="font-semibold text-slate-900">Market research</div>
          <div className="text-slate-500">Find my keynote attached...</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="font-semibold text-slate-900">Market research</div>
          <div className="text-slate-500">I have added the data. Lets check it out together.</div>
        </div>
        <button className="inline-flex items-center gap-2 text-sm font-semibold text-amber-500">
          <PlusCircle size={16} />
          Add
        </button>
      </div>
    </div>
  );
};

export default CommentsCard;
