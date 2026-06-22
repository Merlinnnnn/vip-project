import { mailerService } from '../mailer/mailer.service';
import { welcomeTemplate } from '../mailer/templates/welcome';

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  name: string;
  registeredAt: string;
}

/**
 * Xử lý event user.registered:
 * → Gửi email chào mừng tới người dùng vừa đăng ký.
 */
export async function handleUserRegistered(payload: UserRegisteredPayload): Promise<void> {
  console.log(`[NOTIF] Handling user.registered for: ${payload.email}`);

  const { subject, html } = welcomeTemplate(payload.name, payload.email);

  await mailerService.sendEmail({
    to: payload.email,
    subject,
    html,
  });
}
