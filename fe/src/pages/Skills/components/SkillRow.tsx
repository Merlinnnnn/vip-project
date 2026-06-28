import type { Skill } from "../../../types/skill";
import { Edit2, Trash2 } from "lucide-react";

type Props = {
  skill: Skill;
  onEdit: () => void;
  onDelete: () => void;
};

const SkillRow = ({ skill, onEdit, onDelete }: Props) => {
  const hours = Math.round((skill.totalMinutes / 60) * 10) / 10;
  const targetHours = Math.round((skill.targetMinutes / 60) * 10) / 10;
  
  // Overall Goal Progress
  const goalPercent = Math.min(
    100,
    Math.round((skill.totalMinutes / Math.max(1, skill.targetMinutes)) * 100),
  );

  // Level progress
  const levelPercent = Math.min(
    100,
    Math.round((skill.currentExp / Math.max(1, skill.expToNextLevel)) * 100)
  );

  return (
    <div className="group flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-xs)] transition-all hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]">
      
      {/* 1. Info: Name & Rank */}
      <div className="flex min-w-[200px] flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">{skill.name}</span>
          <span className="rounded bg-[var(--accent-primary-bg)] px-1.5 py-0.5 text-[10px] font-black uppercase text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary-ring)]">
            {skill.rank}
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">Mục tiêu: {targetHours}h</span>
      </div>

      {/* 2. Level Info */}
      <div className="flex min-w-[120px] flex-col items-center gap-1">
        <span className="text-xs font-black text-[var(--accent-primary)]">LVL {skill.level}</span>
        <span className="text-[10px] font-medium text-[var(--text-secondary)]">{skill.currentExp} / {skill.expToNextLevel} exp</span>
      </div>

      {/* 3. Progress Bar */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-[var(--text-secondary)]">{hours}h đã học</span>
          <span className="text-[var(--text-muted)]">{goalPercent}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-secondary)] ring-1 ring-[var(--border-default)]">
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500 ease-out"
            style={{ width: `${levelPercent}%` }}
          />
        </div>
      </div>

      {/* 4. Actions (Visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          title="Chỉnh sửa"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-muted)] hover:bg-[var(--accent-danger-bg)] hover:text-[var(--accent-danger)] transition-colors"
          title="Xóa"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default SkillRow;
