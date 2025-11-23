import Card from "../common/Card";
import type { Skill } from "../../types/skill";

type Props = {
  skill: Skill;
};

const SkillCard = ({ skill }: Props) => {
  const percent = Math.min(
    100,
    Math.round((skill.hours / skill.targetHours) * 100),
  );

  return (
    <Card
      title={skill.name}
      rightSlot={
        <span className="text-xs font-semibold text-emerald-600">
          {percent}% done
        </span>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-slate-700">
          <span>{skill.hours}h logged</span>
          <span>Goal: {skill.targetHours}h</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          Keep compounding—small sessions add up to 10,000h.
        </p>
      </div>
    </Card>
  );
};

export default SkillCard;
