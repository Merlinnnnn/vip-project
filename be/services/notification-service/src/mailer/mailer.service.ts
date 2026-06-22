import nodemailer, { Transporter } from 'nodemailer';
import { envConfig } from '../config/env.config';

/**
 * MailerService — wrapper quanh Nodemailer.
 *
 * Sử dụng Gmail SMTP với App Password.
 * Để lấy App Password:
 *   Google Account → Security → 2-Step Verification → App passwords → Tạo password cho "Mail"
 *
 * Nếu SMTP chưa được cấu hình (SMTP_USER trống), mailer sẽ chỉ log ra console
 * thay vì gửi email thật — tiện lợi khi develop local.
 */
export class MailerService {
  private transporter: Transporter | null = null;
  private readonly config = envConfig();

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: false, // false = STARTTLS (port 587)
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
    return this.transporter;
  }

  /**
   * Gửi email với HTML content.
   * Nếu SMTP_USER chưa được set → chỉ log (dev mode).
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    // Dev mode: nếu chưa cấu hình SMTP, chỉ log ra console
    if (!this.config.smtpUser || this.config.smtpUser === 'your-email@gmail.com') {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[MAILER][DEV MODE] SMTP not configured. Email would be sent:');
      console.log(`  To      : ${options.to}`);
      console.log(`  Subject : ${options.subject}`);
      console.log('  HTML    : [rendered, see template files]');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return;
    }

    try {
      const info = await this.getTransporter().sendMail({
        from: this.config.mailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`[MAILER] Email sent successfully to ${options.to} — MessageId: ${info.messageId}`);
    } catch (err) {
      console.error(`[MAILER] Failed to send email to ${options.to}:`, (err as Error).message);
      // Non-fatal: không throw để consumer tiếp tục xử lý các message khác
    }
  }
}

// Singleton instance
export const mailerService = new MailerService();
