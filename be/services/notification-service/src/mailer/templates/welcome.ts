/**
 * Template email chào mừng khi user đăng ký thành công.
 * Design: dark mode, gradient header, CTA button.
 */
export function welcomeTemplate(name: string, email: string): { subject: string; html: string } {
  return {
    subject: `🎉 Chào mừng ${name} đến với VIP Task Manager!`,
    html: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chào mừng!</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c63ff 0%,#3ecfcf 100%);border-radius:16px 16px 0 0;padding:48px 40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">🚀</div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">
                Chào mừng đến với VIP Task Manager!
              </h1>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.85);font-size:16px;">
                Hành trình nâng cấp năng suất của bạn bắt đầu từ hôm nay.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#1a1a2e;padding:40px;border-left:1px solid #2d2d50;border-right:1px solid #2d2d50;">
              <p style="margin:0 0 24px;color:#c9c9e4;font-size:16px;line-height:1.7;">
                Xin chào <strong style="color:#6c63ff;">${name}</strong> 👋
              </p>
              <p style="margin:0 0 24px;color:#c9c9e4;font-size:16px;line-height:1.7;">
                Tài khoản của bạn đã được tạo thành công với email <strong style="color:#3ecfcf;">${email}</strong>.
                Bạn đã sẵn sàng để:
              </p>

              <!-- Feature list -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                ${featureRow('✅', 'Quản lý tasks', 'Tạo, phân loại và theo dõi tiến độ công việc')}
                ${featureRow('🎯', 'Phát triển kỹ năng', 'Track learning minutes và lên cấp skill')}
                ${featureRow('🔔', 'Nhắc nhở thông minh', 'Nhận thông báo trước khi deadline đến')}
                ${featureRow('📊', 'Thống kê cá nhân', 'Xem dashboard và phân tích hiệu suất')}
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="http://localhost:9999" 
                       style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#3ecfcf);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 40px;border-radius:50px;letter-spacing:0.3px;">
                      🚀 Bắt đầu ngay
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#13132b;border-radius:0 0 16px 16px;padding:24px 40px;border:1px solid #2d2d50;border-top:none;text-align:center;">
              <p style="margin:0;color:#6b6b9a;font-size:13px;line-height:1.6;">
                Email này được gửi tự động bởi <strong style="color:#6c63ff;">VIP Task Manager</strong>.<br/>
                Nếu bạn không tạo tài khoản này, hãy bỏ qua email này.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

function featureRow(icon: string, title: string, desc: string): string {
  return `<tr>
    <td style="padding:8px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="40" valign="top" style="font-size:20px;padding-top:2px;">${icon}</td>
          <td>
            <strong style="color:#ffffff;font-size:15px;">${title}</strong><br/>
            <span style="color:#8888b0;font-size:13px;">${desc}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}
