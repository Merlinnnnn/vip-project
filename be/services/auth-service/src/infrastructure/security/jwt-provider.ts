import { JwtPayload } from '../../shared';

export class JwtProvider {
  sign(payload: JwtPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  verify(token: string): JwtPayload {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(decoded) as JwtPayload;
  }
}
