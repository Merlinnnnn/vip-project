/**
 * Script test SMTP connection và gửi email thử.
 * Chạy: node test-smtp.js
 */
const nodemailer = require('nodemailer');

const config = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: 'merlinnn202333@gmail.com',
  smtpPass: 'nzvc htow cadz bldz',
  mailFrom: 'VIP Task Manager <merlinnn202333@gmail.com>',
};

async function testSmtp() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SMTP Connection Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Host : ${config.smtpHost}:${config.smtpPort}`);
  console.log(`  User : ${config.smtpUser}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    tls: { rejectUnauthorized: false },
  });

  // Bước 1: Verify kết nối SMTP
  console.log('[1] Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log('[1] ✅ SMTP connection OK!\n');
  } catch (err) {
    console.error('[1] ❌ SMTP connection FAILED:', err.message);
    process.exit(1);
  }

  // Bước 2: Gửi email thật
  console.log('[2] Sending test email...');
  try {
    const info = await transporter.sendMail({
      from: config.mailFrom,
      to: config.smtpUser, // Gửi cho chính mình để test
      subject: '✅ [VIP Task Manager] SMTP Test thành công!',
      html: `
        <div style="font-family:Arial,sans-serif;background:#0f0f1a;color:#fff;padding:32px;border-radius:12px;">
          <h2 style="color:#6c63ff;">🎉 SMTP hoạt động!</h2>
          <p style="color:#c9c9e4;">Email này xác nhận rằng cấu hình SMTP của <strong>notification-service</strong> đã đúng.</p>
          <p style="color:#8888b0;font-size:13px;">Sent at: ${new Date().toLocaleString('vi-VN')}</p>
        </div>
      `,
    });
    console.log('[2] ✅ Email sent! MessageId:', info.messageId);
    console.log('\n🎊 Tất cả OK! Kiểm tra inbox của', config.smtpUser);
  } catch (err) {
    console.error('[2] ❌ Failed to send email:', err.message);
    process.exit(1);
  }
}

testSmtp().catch(console.error);
