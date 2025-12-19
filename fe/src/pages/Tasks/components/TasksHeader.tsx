import { Plus, Search } from "lucide-react";
import PageTitle from "../../../components/common/PageTitle";
import { useTaskUiStore } from "../../../store/useTaskUiStore";

const TasksHeader = () => {
  const { setModalOpen } = useTaskUiStore();
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <PageTitle title="Tasks" subtitle="Personal control center" />
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm sm:flex">
          <Search size={16} className="text-slate-400" />
          <input
            className="w-48 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            placeholder="Search"
          />
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
        >
          <Plus size={16} />
          New task
        </button>
      </div>
    </div>
  );
};

export default TasksHeader;
