import bcrypt from 'bcryptjs';

/**
 * Sử dụng bcrypt với salt rounds = 12.
 * bcrypt có khả năng chống brute-force nhờ:
 *  - Slow hashing (cost factor): mỗi lần hash mất ~300ms
 *  - Auto-generate salt: mỗi password có salt riêng → chống rainbow table
 *
 * SHA256 (cũ) KHÔNG phù hợp cho password vì:
 *  - Quá nhanh → brute-force dễ dàng
 *  - Không có salt → rainbow table attack
 */
const SALT_ROUNDS = 12;

export class PasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
