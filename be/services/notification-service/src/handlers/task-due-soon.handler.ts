import { mailerService } from '../mailer/mailer.service';
import { taskReminderTemplate } from '../mailer/templates/task-reminder';

export interface TaskDueSoonPayload {
  taskId: string;
  userId: string;
  title: string;
  dueDate: string;
  userEmail?: string; // Optional: nếu task-service có thể cung cấp
  firedAt: string;
}

/**
 * Xử lý event task.due_soon:
 * → Gửi email nhắc nhở deadline tới user.
 *
 * NOTE: Hiện tại task-service không lưu email trong task payload.
 * Cần user email để gửi. Có 2 cách:
 *   1. task-service include email trong event payload (recommended)
 *   2. notification-service gọi auth-service để lấy email (HTTP call)
 *
 * Hiện implement theo cách 1: task-service cần truyền userEmail.
 * Nếu không có email, chỉ log warning.
 */
export async function handleTaskDueSoon(payload: TaskDueSoonPayload): Promise<void> {
  console.log(`[NOTIF] Handling task.due_soon: "${payload.title}" (taskId: ${payload.taskId})`);

  if (!payload.userEmail) {
    console.warn(`[NOTIF] task.due_soon — missing userEmail in payload. Cannot send email for task ${payload.taskId}.`);
    console.warn('[NOTIF] Tip: Update task-service to include userEmail in the task.due_soon event payload.');
    return;
  }

  const { subject, html } = taskReminderTemplate(payload.title, payload.dueDate, payload.taskId);

  await mailerService.sendEmail({
    to: payload.userEmail,
    subject,
    html,
  });
}
