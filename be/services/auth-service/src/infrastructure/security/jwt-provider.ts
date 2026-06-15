import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { envConfig } from '../../config/env.config';
import type { JwtPayload } from '../../shared';

export class JwtProvider {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    const config = envConfig();
    this.secret = config.jwtSecret;
    this.expiresIn = config.jwtExpiresIn;
  }

  /**
   * Ký một access token JWT với HMAC-SHA256.
   * Token có chứa chữ ký — bất kỳ sự thay đổi nào sẽ bị phát hiện khi verify.
   */
  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });
  }

  /**
   * Xác thực chữ ký và decode JWT.
   * Throw lỗi rõ ràng nếu token invalid hoặc đã hết hạn.
   */
  verify(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      return decoded as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new Error('Access token has expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw err;
    }
  }

  /**
   * Tạo opaque refresh token (random hex) — không phải JWT.
   * Refresh token không chứa payload, chỉ là một chuỗi ngẫu nhiên dùng để tra cứu DB.
   */
  generateRefreshToken(daysValid = 7) {
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
    return { token, expiresAt };
  }
}
