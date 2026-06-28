import { useState, useEffect, type FormEvent, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, Target, Clock, Trophy } from "lucide-react";
import {
  useSkills,
  useCreateSkill,
  useUpdateSkill,
  useDeleteSkill,
} from "../../hooks/useSkills";
import AddSkillForm from "./components/AddSkillForm";
import SkillRow from "./components/SkillRow";
import SkillRowEdit from "./components/SkillRowEdit";
import SkillRowDelete from "./components/SkillRowDelete";

const defaultForm = { name: "", targetHours: 10000 };
const ITEMS_PER_PAGE = 4;

const SkillsPage = () => {
  const { data: skills = [], isLoading } = useSkills();
  const createSkill = useCreateSkill();
  const updateSkillMutation = useUpdateSkill();
  const deleteSkillMutation = useDeleteSkill();

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(skills.length / ITEMS_PER_PAGE));
  
  // Ensure we don't end up on an empty page after deletion
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const currentSkills = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return skills.slice(start, start + ITEMS_PER_PAGE);
  }, [skills, currentPage]);

  // Derived stats for the summary cards
  const totalHours = useMemo(() => {
    return Math.round(skills.reduce((acc, skill) => acc + (skill.totalMinutes || 0) / 60, 0) * 10) / 10;
  }, [skills]);

  const maxLevel = useMemo(() => {
    return skills.reduce((acc, skill) => Math.max(acc, skill.level || 0), 0);
  }, [skills]);

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
        onSuccess: () => {
          setForm({ ...defaultForm, targetHours: form.targetHours });
          setIsAdding(false);
          setCurrentPage(1);
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  const startEdit = (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;
    setEditingId(skillId);
    setConfirmDeleteId(null);
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
    <div className="flex h-full flex-col gap-6">
      
      {/* ── Page Header & Stats ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-sm)]">
        
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-success)] bg-clip-text text-3xl font-extrabold text-transparent">
              Kỹ Năng & Mục Tiêu
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Quản lý hành trình 10,000 giờ của bạn. Mỗi giờ học là một bước tiến gần hơn tới sự xuất chúng.
            </p>
          </div>
          <button
            onClick={() => setIsAdding((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 ${
              isAdding
                ? "bg-[var(--surface-secondary)] text-[var(--text-secondary)] ring-1 ring-[var(--border-strong)]"
                : "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)] text-[var(--text-inverse)] shadow-[var(--shadow-md)]"
            }`}
          >
            <Plus className={`h-4 w-4 transition-transform duration-300 ${isAdding ? "rotate-45" : ""}`} />
            {isAdding ? "Hủy thêm mới" : "Khám phá kỹ năng mới"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary-bg)] text-[var(--accent-primary)]">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Tổng Skills</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{skills.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-success-bg)] text-[var(--accent-success)]">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Tổng Giờ Tích Lũy</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalHours}h</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-warning-bg)] text-[var(--accent-warning)]">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Cấp Độ Cao Nhất</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">LVL {maxLevel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {isAdding && (
          <AddSkillForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            isPending={createSkill.isPending}
            error={error}
            skills={skills}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm font-medium text-[var(--text-muted)] animate-pulse">Đang tải dữ liệu kỹ năng...</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="flex flex-col gap-3 flex-1">
              {currentSkills.map((skill) => {
                if (editingId === skill.id) {
                  return (
                    <SkillRowEdit
                      key={skill.id}
                      form={editForm}
                      onChange={setEditForm}
                      onSave={() => submitEdit(skill.id)}
                      onCancel={cancelEdit}
                      isPending={isMutating}
                    />
                  );
                }

                if (confirmDeleteId === skill.id) {
                  return (
                    <SkillRowDelete
                      key={skill.id}
                      skillName={skill.name}
                      onConfirm={() => confirmDelete(skill.id)}
                      onCancel={() => setConfirmDeleteId(null)}
                      isPending={deleteSkillMutation.isPending}
                    />
                  );
                }

                return (
                  <SkillRow
                    key={skill.id}
                    skill={skill}
                    onEdit={() => startEdit(skill.id)}
                    onDelete={() => {
                      setConfirmDeleteId(skill.id);
                      setEditingId(null);
                    }}
                  />
                );
              })}
              
              {skills.length === 0 && !isAdding && (
                <div className="flex flex-1 flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border-default)] bg-[var(--surface-primary)] p-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-secondary)] ring-8 ring-[var(--surface-base)]">
                    <Target className="h-8 w-8 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Chưa có kỹ năng nào</h3>
                  <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
                    Hãy bắt đầu hành trình của bạn ngay hôm nay bằng cách thêm một kỹ năng mà bạn muốn chinh phục.
                  </p>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="mt-6 flex items-center gap-2 rounded-full bg-[var(--text-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--surface-primary)] shadow-[var(--shadow-md)] transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-4 w-4" /> Bắt đầu ngay
                  </button>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {skills.length > 0 && (
              <div className="mt-6 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 shadow-[var(--shadow-sm)]">
                <span className="text-sm text-[var(--text-secondary)]">
                  Hiển thị <span className="font-bold text-[var(--text-primary)]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-[var(--text-primary)]">{Math.min(currentPage * ITEMS_PER_PAGE, skills.length)}</span> trong <span className="font-bold text-[var(--text-primary)]">{skills.length}</span> kỹ năng
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:hover:bg-[var(--surface-primary)]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[40px] text-center text-sm font-semibold text-[var(--text-primary)]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-primary)] text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:hover:bg-[var(--surface-primary)]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsPage;
