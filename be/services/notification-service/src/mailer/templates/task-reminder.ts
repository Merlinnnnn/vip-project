/**
 * Template email nhắc nhở deadline task.
 * Design: cảnh báo màu cam/đỏ, countdown style.
 */
export function taskReminderTemplate(
  taskTitle: string,
  dueDate: string,
  taskId: string
): { subject: string; html: string } {
  const due = new Date(dueDate);
  const formattedDate = due.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = due.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    subject: `⏰ Nhắc nhở: Task "${taskTitle}" đến hạn rồi!`,
    html: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nhắc nhở deadline</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header - alert style -->
          <tr>
            <td style="background:linear-gradient(135deg,#ff6b35 0%,#f7c59f 100%);border-radius:16px 16px 0 0;padding:48px 40px;text-align:center;">
              <div style="font-size:56px;margin-bottom:12px;">⏰</div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                Deadline đang đến gần!
              </h1>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                Đừng để task này bị quá hạn.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#1a1a2e;padding:40px;border-left:1px solid #2d2d50;border-right:1px solid #2d2d50;">

              <!-- Task Card -->
              <div style="background:linear-gradient(135deg,rgba(255,107,53,0.1),rgba(247,197,159,0.05));border:1px solid rgba(255,107,53,0.3);border-left:4px solid #ff6b35;border-radius:12px;padding:24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#ff8c5a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                  📋 Task cần hoàn thành
                </p>
                <h2 style="margin:0 0 16px;color:#ffffff;font-size:20px;font-weight:700;line-height:1.3;">
                  ${taskTitle}
                </h2>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:24px;">
                      <p style="margin:0;color:#8888b0;font-size:12px;">📅 Ngày</p>
                      <p style="margin:4px 0 0;color:#f7c59f;font-size:14px;font-weight:600;">${formattedDate}</p>
                    </td>
                    <td>
                      <p style="margin:0;color:#8888b0;font-size:12px;">🕐 Giờ</p>
                      <p style="margin:4px 0 0;color:#f7c59f;font-size:14px;font-weight:600;">${formattedTime}</p>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin:0 0 28px;color:#c9c9e4;font-size:15px;line-height:1.7;">
                Task của bạn đã đến hạn. Hãy nhanh chóng hoàn thành hoặc cập nhật trạng thái để không bị ghi nhận là <strong style="color:#ff6b35;">overdue</strong>.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="http://localhost:9999" 
                       style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#f7c59f);color:#1a0a00;text-decoration:none;font-size:16px;font-weight:700;padding:14px 40px;border-radius:50px;">
                      ✅ Xem Task ngay
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
                Thông báo từ <strong style="color:#ff6b35;">VIP Task Manager</strong> · Task ID: <code style="color:#8888b0;">${taskId.slice(0, 8)}...</code>
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
