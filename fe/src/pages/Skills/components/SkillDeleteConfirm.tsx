type Props = {
  skillName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
};

const SkillDeleteConfirm = ({ skillName, onConfirm, onCancel, isPending }: Props) => {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm space-y-3">
      <p className="text-sm font-semibold text-rose-700">Xóa skill "{skillName}"?</p>
      <p className="text-xs text-rose-600">Các task đang gắn skill này sẽ bị bỏ liên kết.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-70"
        >
          {isPending ? "Đang xóa..." : "Xác nhận xóa"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Hủy
        </button>
      </div>
    </div>
  );
};

export default SkillDeleteConfirm;
