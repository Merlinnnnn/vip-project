/**
 * Template email chúc mừng khi skill lên cấp.
 * Design: celebration style với golden/purple gradient, level badge.
 */
export function skillLevelUpTemplate(
  skillName: string,
  newLevel: number,
  rank: string,
  totalMinutes: number
): { subject: string; html: string } {
  const totalHours = Math.floor(totalMinutes / 60);
  const rankEmoji = getRankEmoji(rank);
  const rankColor = getRankColor(rank);

  return {
    subject: `🎊 Chúc mừng! Skill "${skillName}" vừa lên Level ${newLevel}!`,
    html: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Level Up!</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header - celebration gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#7b2ff7 0%,#f107a3 50%,#ffd700 100%);border-radius:16px 16px 0 0;padding:48px 40px;text-align:center;">
              <div style="font-size:64px;margin-bottom:8px;">🎊</div>
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.9);font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;">
                Level Up!
              </p>
              <h1 style="margin:0;color:#ffffff;font-size:30px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 2px 20px rgba(0,0,0,0.3);">
                ${skillName}
              </h1>
            </td>
          </tr>

          <!-- Level Badge Section -->
          <tr>
            <td style="background:#1a1a2e;padding:0 40px;border-left:1px solid #2d2d50;border-right:1px solid #2d2d50;">
              <!-- Big level display -->
              <div style="text-align:center;margin:-1px 0 32px;padding:32px;background:linear-gradient(135deg,rgba(123,47,247,0.15),rgba(241,7,163,0.10));border-radius:16px;border:1px solid rgba(123,47,247,0.3);">
                <p style="margin:0 0 8px;color:#9966ff;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">
                  Cấp độ mới
                </p>
                <div style="font-size:80px;font-weight:900;color:#ffffff;line-height:1;background:linear-gradient(135deg,#7b2ff7,#f107a3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                  ${newLevel}
                </div>
                <!-- Rank badge -->
                <div style="display:inline-block;margin-top:12px;background:${rankColor};color:#ffffff;font-size:13px;font-weight:700;padding:6px 20px;border-radius:50px;letter-spacing:0.5px;">
                  ${rankEmoji} ${rank}
                </div>
              </div>
            </td>
          </tr>

          <!-- Stats Section -->
          <tr>
            <td style="background:#1a1a2e;padding:0 40px 32px;border-left:1px solid #2d2d50;border-right:1px solid #2d2d50;">
              <table width="100%" cellpadding="0" cellspacing="16">
                <tr>
                  ${statCell('⏱️', 'Tổng thời gian', `${totalMinutes.toLocaleString()} phút`)}
                  ${statCell('🕐', 'Tổng giờ học', `${totalHours} giờ`)}
                  ${statCell('⭐', 'Level hiện tại', `Lv.${newLevel}`)}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="background:#1a1a2e;padding:0 40px 32px;border-left:1px solid #2d2d50;border-right:1px solid #2d2d50;">
              <p style="margin:0 0 24px;color:#c9c9e4;font-size:15px;line-height:1.7;text-align:center;">
                Tuyệt vời! Bạn đã đạt <strong style="color:#9966ff;">Level ${newLevel}</strong> trong kỹ năng
                <strong style="color:#f107a3;">${skillName}</strong>. Hãy tiếp tục cố gắng để chinh phục những cấp độ cao hơn! 💪
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="http://localhost:9999/skills" 
                       style="display:inline-block;background:linear-gradient(135deg,#7b2ff7,#f107a3);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 40px;border-radius:50px;">
                      🏆 Xem tất cả Skills
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
                Thông báo từ <strong style="color:#9966ff;">VIP Task Manager</strong><br/>
                Bạn nhận được email này vì đã đạt mốc level mới.
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

function statCell(icon: string, label: string, value: string): string {
  return `<td style="background:rgba(123,47,247,0.08);border:1px solid rgba(123,47,247,0.2);border-radius:12px;padding:16px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">${icon}</div>
    <p style="margin:0 0 4px;color:#8888b0;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">${label}</p>
    <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;">${value}</p>
  </td>`;
}

function getRankEmoji(rank: string): string {
  const map: Record<string, string> = {
    Legend: '👑', Master: '💎', Expert: '🔥', Veteran: '⚔️', Adventurer: '🗡️', Novice: '🌱',
  };
  return map[rank] ?? '⭐';
}

function getRankColor(rank: string): string {
  const map: Record<string, string> = {
    Legend: 'linear-gradient(135deg,#ffd700,#ff8c00)',
    Master: 'linear-gradient(135deg,#a855f7,#3b82f6)',
    Expert: 'linear-gradient(135deg,#ef4444,#f97316)',
    Veteran: 'linear-gradient(135deg,#22c55e,#16a34a)',
    Adventurer: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
    Novice: 'linear-gradient(135deg,#6b7280,#9ca3af)',
  };
  return map[rank] ?? 'linear-gradient(135deg,#6c63ff,#3ecfcf)';
}
