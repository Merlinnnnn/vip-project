export interface NotificationEnvConfig {
  port: number;
  rabbitmqUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  mailFrom: string;
}

export const envConfig = (): NotificationEnvConfig => {
  return {
    port: Number(process.env.PORT ?? 3002),
    rabbitmqUrl: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
    smtpHost: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpUser: process.env.SMTP_USER ?? '',
    smtpPass: process.env.SMTP_PASS ?? '',
    mailFrom: process.env.MAIL_FROM ?? 'VIP Task Manager <noreply@vip-tasks.app>',
  };
};
