import { AlertTriangle, Trash2, X } from "lucide-react";

type Props = {
  skillName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
};

const SkillRowDelete = ({ skillName, onConfirm, onCancel, isPending }: Props) => {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--accent-danger-ring)] bg-[var(--accent-danger-bg)] p-3 shadow-[var(--shadow-xs)]">
      <div className="flex flex-1 items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-[var(--accent-danger)]" />
        <span className="text-sm font-medium text-[var(--accent-danger-text)]">
          Bạn có chắc chắn muốn xóa skill "{skillName}"?
        </span>
        <span className="text-xs text-[var(--accent-danger)]">
          (Các task đang gắn skill này sẽ bị bỏ liên kết)
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--accent-danger)] px-3 py-1.5 text-xs font-medium text-[var(--surface-primary)] hover:bg-[var(--accent-danger-hover)] disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" /> {isPending ? "Đang xóa..." : "Xóa"}
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

export default SkillRowDelete;
