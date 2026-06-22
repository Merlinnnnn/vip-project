import { mailerService } from '../mailer/mailer.service';
import { skillLevelUpTemplate } from '../mailer/templates/skill-level-up';

export interface SkillLevelUpPayload {
  userId: string;
  skillId: string;
  skillName: string;
  newLevel: number;
  rank: string;
  totalMinutes: number;
  userEmail?: string; // Optional: cần task-service truyền vào
  achievedAt: string;
}

/**
 * Xử lý event skill.level_up:
 * → Gửi email chúc mừng khi skill lên cấp.
 */
export async function handleSkillLevelUp(payload: SkillLevelUpPayload): Promise<void> {
  console.log(`[NOTIF] Handling skill.level_up: "${payload.skillName}" → Level ${payload.newLevel} (${payload.rank})`);

  if (!payload.userEmail) {
    console.warn(`[NOTIF] skill.level_up — missing userEmail in payload. Cannot send email for skill ${payload.skillId}.`);
    console.warn('[NOTIF] Tip: Update task-service to include userEmail in the skill.level_up event payload.');
    return;
  }

  const { subject, html } = skillLevelUpTemplate(
    payload.skillName,
    payload.newLevel,
    payload.rank,
    payload.totalMinutes
  );

  await mailerService.sendEmail({
    to: payload.userEmail,
    subject,
    html,
  });
}
