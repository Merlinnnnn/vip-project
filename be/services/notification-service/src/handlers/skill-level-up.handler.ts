import { mailerService } from '../mailer/mailer.service';
import { skillLevelUpTemplate } from '../mailer/templates/skill-level-up';
import { userEmailResolver } from '../resolvers/user-email.resolver';

export interface SkillLevelUpPayload {
  userId: string;
  skillId: string;
  skillName: string;
  newLevel: number;
  rank: string;
  totalMinutes: number;
  achievedAt: string;
}

/**
 * Xử lý event skill.level_up:
 * 1. Gọi auth-service để lấy email của user theo userId
 * 2. Gửi email chúc mừng lên cấp
 */
export async function handleSkillLevelUp(payload: SkillLevelUpPayload): Promise<void> {
  console.log(`[NOTIF] Handling skill.level_up: "${payload.skillName}" → Level ${payload.newLevel} (${payload.rank})`);

  // Lấy email từ auth-service qua internal HTTP call
  const userProfile = await userEmailResolver.resolve(payload.userId);
  if (!userProfile) {
    console.warn(`[NOTIF] skill.level_up — Cannot resolve email for userId: ${payload.userId}. Skipping email.`);
    return;
  }

  const { subject, html } = skillLevelUpTemplate(
    payload.skillName,
    payload.newLevel,
    payload.rank,
    payload.totalMinutes
  );

  await mailerService.sendEmail({
    to: userProfile.email,
    subject,
    html,
  });
}
