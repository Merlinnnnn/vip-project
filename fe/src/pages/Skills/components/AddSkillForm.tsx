import type { FormEvent } from "react";
import type { Skill } from "../../../types/skill";

type FormState = { name: string; targetHours: number };

type Props = {
  form: FormState;
  onChange: (next: FormState) => void;
  onSubmit: (e: FormEvent) => void;
  isPending: boolean;
  error: string | null;
  skills: Skill[];
};

const AddSkillForm = ({ form, onChange, onSubmit, isPending, error }: Props) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-600">Tên skill</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="Ví dụ: English speaking"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Mục tiêu (giờ)</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            value={form.targetHours}
            onChange={(e) => onChange({ ...form, targetHours: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Đang lưu..." : "Thêm skill"}
          </button>
        </div>
      </form>
      {error ? <p className="mt-2 text-sm text-rose-500">{error}</p> : null}
    </div>
  );
};

export default AddSkillForm;
