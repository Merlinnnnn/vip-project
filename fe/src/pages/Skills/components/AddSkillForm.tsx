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
  onCancel: () => void;
};

const AddSkillForm = ({ form, onChange, onSubmit, isPending, error, onCancel }: Props) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Thêm Skill Mới</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Hủy
        </button>
      </div>
      
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Tên skill</label>
          <input
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary-ring)]"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="Ví dụ: English speaking"
          />
        </div>
        <div className="w-full space-y-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Mục tiêu (giờ)</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary-ring)]"
            value={form.targetHours}
            onChange={(e) => onChange({ ...form, targetHours: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="mt-2 flex w-full justify-end gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-[var(--radius-sm)] bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Đang lưu..." : "Lưu skill"}
          </button>
        </div>
      </form>
      {error ? <p className="mt-2 text-sm text-[var(--accent-danger)]">{error}</p> : null}
      </div>
    </div>
  );
};

export default AddSkillForm;
