import { useState, type FormEvent } from "react";
import PageTitle from "../../components/common/PageTitle";
import SkillCard from "../../components/skills/SkillCard";
import {
  useSkills,
  useCreateSkill,
  useUpdateSkill,
  useDeleteSkill,
} from "../../hooks/useSkills";

const defaultForm = { name: "", targetHours: 10000 };

const SkillsPage = () => {
  const { data: skills = [], isLoading } = useSkills();
  const createSkill = useCreateSkill();
  const updateSkillMutation = useUpdateSkill();
  const deleteSkillMutation = useDeleteSkill();

  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(defaultForm);
  const [error, setError] = useState<string | null>(null);

  const isMutating =
    createSkill.isPending ||
    updateSkillMutation.isPending ||
    deleteSkillMutation.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Tên skill không được để trống");
      return;
    }
    setError(null);

    createSkill.mutate(
      {
        name: form.name.trim(),
        targetMinutes: Math.max(1, form.targetHours) * 60,
      },
      {
        onSuccess: () =>
          setForm({ ...defaultForm, targetHours: form.targetHours }),
        onError: (err) => setError(err.message),
      },
    );
  };

  const startEdit = (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;
    setEditingId(skillId);
    setEditForm({
      name: skill.name,
      targetHours:
        Math.max(1, Math.round((skill.targetMinutes ?? 0) / 60)) || 1,
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(defaultForm);
  };

  const submitEdit = (skillId: string) => {
    if (!editForm.name.trim()) {
      setError("Tên skill không được để trống");
      return;
    }
    setError(null);

    updateSkillMutation.mutate(
      {
        id: skillId,
        input: {
          name: editForm.name.trim(),
          targetMinutes: Math.max(1, editForm.targetHours) * 60,
        },
      },
      {
        onSuccess: () => cancelEdit(),
        onError: (err) => setError(err.message),
      },
    );
  };

  const handleDelete = (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    const confirmed = window.confirm(
      `Xóa skill "${skill?.name ?? ""}"? Các task đang gắn skill này sẽ bị bỏ liên kết.`,
    );
    if (!confirmed) return;
    setError(null);

    deleteSkillMutation.mutate(skillId, {
      onSuccess: () => {
        if (editingId === skillId) cancelEdit();
      },
      onError: (err) => setError(err.message),
    });
  };

  return (
    <div className="space-y-4">
      <PageTitle
        title="Skills"
        subtitle="Theo dõi giờ học cho từng skill và gắn task để tích lũy thời gian."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              Tên skill
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ví dụ: English speaking"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              Mục tiêu (giờ)
            </label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={form.targetHours}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  targetHours: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isMutating}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createSkill.isPending ? "Đang lưu..." : "Thêm skill"}
            </button>
          </div>
        </form>
        {error ? <p className="mt-2 text-sm text-rose-500">{error}</p> : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Đang tải skill...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {skills.map((skill) =>
            editingId === skill.id ? (
              <div
                key={skill.id}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-700">
                    Chỉnh sửa skill
                  </p>
                  <button
                    type="button"
                    onClick={cancelEdit}
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
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </label>
                  <label className="space-y-1 text-xs font-semibold text-slate-700">
                    <span className="block">Mục tiêu (giờ)</span>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      value={editForm.targetHours}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          targetHours: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => submitEdit(skill.id)}
                    disabled={isMutating}
                    className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-70"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(skill.id)}
                    disabled={isMutating}
                    className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 disabled:opacity-70"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ) : (
              <div key={skill.id} className="space-y-2">
                <SkillCard skill={skill} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(skill.id)}
                    className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(skill.id)}
                    className="flex-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ),
          )}
          {skills.length === 0 ? (
            <p className="text-sm text-slate-500">
              Chưa có skill nào, hãy thêm mới.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SkillsPage;
