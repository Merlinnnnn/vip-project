import { Check, X } from "lucide-react";

type FormState = { name: string; targetHours: number };

type Props = {
  form: FormState;
  onChange: (next: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
};

const SkillRowEdit = ({ form, onChange, onSave, onCancel, isPending }: Props) => {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--accent-warning-ring)] bg-[var(--accent-warning-bg)] p-3 shadow-[var(--shadow-xs)]">
      <div className="flex flex-1 items-center gap-3">
        <input
          className="flex-1 rounded-[var(--radius-sm)] border border-[var(--accent-warning-ring)] bg-[var(--surface-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-warning)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-warning-ring)]"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="Tên skill"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Mục tiêu:</span>
          <input
            type="number"
            min={1}
            className="w-24 rounded-[var(--radius-sm)] border border-[var(--accent-warning-ring)] bg-[var(--surface-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-warning)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-warning-ring)]"
            value={form.targetHours}
            onChange={(e) => onChange({ ...form, targetHours: Number(e.target.value) || 0 })}
          />
          <span className="text-xs text-[var(--text-secondary)]">h</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--accent-success)] px-3 py-1.5 text-xs font-medium text-[var(--surface-primary)] hover:bg-[var(--accent-success-hover)] disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Lưu
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--surface-secondary)] disabled:opacity-50"
        >
          <X className="h-4 w-4" /> Hủy
        </button>
      </div>
    </div>
  );
};

export default SkillRowEdit;
