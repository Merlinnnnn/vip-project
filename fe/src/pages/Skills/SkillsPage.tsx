import { useState, type FormEvent } from "react";
import PageTitle from "../../components/ui/PageTitle";
import {
  useSkills,
  useCreateSkill,
  useUpdateSkill,
  useDeleteSkill,
} from "../../hooks/useSkills";
import SkillCard from "./components/SkillCard";
import AddSkillForm from "./components/AddSkillForm";
import SkillEditCard from "./components/SkillEditCard";
import SkillDeleteConfirm from "./components/SkillDeleteConfirm";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      { name: form.name.trim(), targetMinutes: Math.max(1, form.targetHours) * 60 },
      {
        onSuccess: () => setForm({ ...defaultForm, targetHours: form.targetHours }),
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
      targetHours: Math.max(1, Math.round((skill.targetMinutes ?? 0) / 60)) || 1,
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
      { id: skillId, input: { name: editForm.name.trim(), targetMinutes: Math.max(1, editForm.targetHours) * 60 } },
      { onSuccess: () => cancelEdit(), onError: (err) => setError(err.message) },
    );
  };

  const confirmDelete = (skillId: string) => {
    setConfirmDeleteId(null);
    setError(null);
    deleteSkillMutation.mutate(skillId, {
      onSuccess: () => { if (editingId === skillId) cancelEdit(); },
      onError: (err) => setError(err.message),
    });
  };

  return (
    <div className="space-y-4">
      <PageTitle
        title="Skills"
        subtitle="Theo dõi giờ học cho từng skill và gắn task để tích lũy thời gian."
      />

      <AddSkillForm
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        isPending={createSkill.isPending}
        error={error}
        skills={skills}
      />

      {isLoading ? (
        <p className="text-sm text-slate-600">Đang tải skill...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {skills.map((skill) => {
            if (editingId === skill.id) {
              return (
                <SkillEditCard
                  key={skill.id}
                  skillId={skill.id}
                  skillName={skill.name}
                  form={editForm}
                  onChange={setEditForm}
                  onSave={() => submitEdit(skill.id)}
                  onCancel={cancelEdit}
                  onDelete={() => setConfirmDeleteId(skill.id)}
                  isPending={isMutating}
                />
              );
            }

            if (confirmDeleteId === skill.id) {
              return (
                <SkillDeleteConfirm
                  key={skill.id}
                  skillName={skill.name}
                  onConfirm={() => confirmDelete(skill.id)}
                  onCancel={() => setConfirmDeleteId(null)}
                  isPending={deleteSkillMutation.isPending}
                />
              );
            }

            return (
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
                    onClick={() => setConfirmDeleteId(skill.id)}
                    className="flex-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
          {skills.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có skill nào, hãy thêm mới.</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SkillsPage;
