import { useEffect, useMemo, useState, type FormEvent } from "react";
import PageTitle from "../../components/common/PageTitle";
import SkillCard from "../../components/skills/SkillCard";
import { listSkills, createSkill } from "../../lib/skillsApi";
import { useAuth } from "../../routes/AuthContext";
import { useSkillsStore } from "../../store/useSkillsStore";

const defaultForm = { name: "", targetHours: 10000 };

const SkillsPage = () => {
  const { user, token } = useAuth();
  const { skills, setSkills, addSkill } = useSkillsStore();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSkills = useMemo(
    () => async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const data = await listSkills({ userId: user.id, token });
        setSkills(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [setSkills, token, user],
  );

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Tên skill không được để trống");
      return;
    }
    if (!user) {
      setError("Bạn cần đăng nhập lại.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const created = await createSkill(
        { userId: user.id, token },
        { name: form.name.trim(), targetMinutes: Math.max(1, form.targetHours) * 60 },
      );
      addSkill(created);
      setForm({ ...defaultForm, targetHours: form.targetHours });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
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
            <label className="text-xs font-semibold text-slate-600">Tên skill</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
              onChange={(e) => setForm((f) => ({ ...f, targetHours: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Đang lưu..." : "Thêm skill"}
            </button>
          </div>
        </form>
        {error ? <p className="mt-2 text-sm text-rose-500">{error}</p> : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Đang tải skill...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
          {skills.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có skill nào, hãy thêm mới.</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SkillsPage;
