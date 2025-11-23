import { JwtPayload } from '../../shared';
import { randomBytes } from 'crypto';

export class JwtProvider {
  sign(payload: JwtPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  verify(token: string): JwtPayload {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(decoded) as JwtPayload;
  }

  generateRefreshToken(daysValid = 7) {
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
    return { token, expiresAt };
  }
}
