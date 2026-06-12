type FormState = { name: string; targetHours: number };

type Props = {
  skillId: string;
  skillName: string;
  form: FormState;
  onChange: (next: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  isPending: boolean;
};

const SkillEditCard = ({
  skillName: _skillName,
  form,
  onChange,
  onSave,
  onCancel,
  onDelete,
  isPending,
}: Props) => {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-amber-700">Chỉnh sửa skill</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-slate-600 hover:text-slate-800"
        >
          Hủy
        </button>
      </div>
      <div className="space-y-2">
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          <span className="block">Tên skill</span>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          <span className="block">Mục tiêu (giờ)</span>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            value={form.targetHours}
            onChange={(e) => onChange({ ...form, targetHours: Number(e.target.value) || 0 })}
          />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-70"
        >
          Lưu
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 disabled:opacity-70"
        >
          Xóa
        </button>
      </div>
    </div>
  );
};

export default SkillEditCard;
