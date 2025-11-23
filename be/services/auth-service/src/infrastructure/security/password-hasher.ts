import { createHash } from 'crypto';

export class PasswordHasher {
  async hash(plain: string): Promise<string> {
    return createHash('sha256').update(plain).digest('hex');
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return (await this.hash(plain)) === hashed;
  }
}
