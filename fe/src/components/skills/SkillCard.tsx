import Card from "../common/Card";
import type { Skill } from "../../types/skill";

type Props = {
  skill: Skill;
};

const SkillCard = ({ skill }: Props) => {
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
    <Card
      title={
        <div className="flex items-center gap-2">
          <span>{skill.name}</span>
          <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-black uppercase ring-1 ring-indigo-200">
            {skill.rank}
          </span>
        </div>
      }
      rightSlot={
        <div className="flex flex-col items-end">
          <span className="text-xs font-black text-indigo-600">LVL {skill.level}</span>
          <span className="text-[10px] text-slate-400">{goalPercent}% of goal</span>
        </div>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-slate-700 text-xs">
          <span>{hours}h logged</span>
          <span className="font-medium text-indigo-500">{skill.currentExp} / {skill.expToNextLevel} exp</span>
        </div>
        
        {/* Level Progress Bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
          <div
            className="h-full rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all"
            style={{ width: `${levelPercent}%` }}
          />
        </div>

        <p className="text-[10px] text-slate-400 italic">
          Goal: {targetHours}h total mastery.
        </p>
      </div>
    </Card>
  );
};

export default SkillCard;
