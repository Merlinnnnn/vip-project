import { mailerService } from '../mailer/mailer.service';
import { taskReminderTemplate } from '../mailer/templates/task-reminder';
import { userEmailResolver } from '../resolvers/user-email.resolver';

export interface TaskDueSoonPayload {
  taskId: string;
  userId: string;
  title: string;
  dueDate: string;
  firedAt: string;
}

/**
 * Xử lý event task.due_soon:
 * 1. Gọi auth-service để lấy email của user theo userId
 * 2. Gửi email nhắc nhở deadline
 */
export async function handleTaskDueSoon(payload: TaskDueSoonPayload): Promise<void> {
  console.log(`[NOTIF] Handling task.due_soon: "${payload.title}" (taskId: ${payload.taskId})`);

  // Lấy email từ auth-service qua internal HTTP call
  const userProfile = await userEmailResolver.resolve(payload.userId);
  if (!userProfile) {
    console.warn(`[NOTIF] task.due_soon — Cannot resolve email for userId: ${payload.userId}. Skipping email.`);
    return;
  }

  const { subject, html } = taskReminderTemplate(payload.title, payload.dueDate, payload.taskId);

  await mailerService.sendEmail({
    to: userProfile.email,
    subject,
    html,
  });
}
