import PageTitle from "../../components/common/PageTitle";
import SkillCard from "../../components/skills/SkillCard";
import type { Skill } from "../../types/skill";

const skills: Skill[] = [
  { id: 1, name: "English Speaking", hours: 420, targetHours: 10000 },
  { id: 2, name: "DevOps", hours: 260, targetHours: 10000 },
  { id: 3, name: "AI Research", hours: 610, targetHours: 10000 },
];

const SkillsPage = () => (
  <div className="space-y-4">
    <PageTitle
      title="Skills (10.000h)"
      subtitle="Mock data: tiến độ giờ luyện tập cho từng skill."
    />
    <div className="grid gap-4 md:grid-cols-3">
      {skills.map((skill) => (
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  </div>
);

export default SkillsPage;
