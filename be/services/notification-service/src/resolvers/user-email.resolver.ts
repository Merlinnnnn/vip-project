/**
 * UserEmailResolver — gọi HTTP tới auth-service để lấy thông tin user theo userId.
 *
 * Pattern: Option B (clean separation) — notification-service không cần biết về DB,
 * chỉ gọi internal API của auth-service.
 *
 * Bảo vệ bằng X-Internal-Secret header — cùng giá trị với INTERNAL_SECRET trong auth-service.
 *
 * Cache đơn giản trong memory để tránh gọi HTTP lặp lại cho cùng userId
 * (TTL 5 phút vì email/name hiếm khi thay đổi trong thời gian ngắn).
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

interface CacheEntry {
  profile: UserProfile;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

export class UserEmailResolver {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly authServiceUrl: string;
  private readonly internalSecret: string;

  constructor() {
    // Trong Docker network: auth-service resolve thành container name
    this.authServiceUrl = process.env.AUTH_SERVICE_URL ?? 'http://auth-service:3000';
    this.internalSecret = process.env.INTERNAL_SECRET ?? 'vip-internal-secret-2024';
  }

  /**
   * Lấy profile của user theo userId.
   * Trả về null nếu không tìm thấy hoặc auth-service không phản hồi.
   */
  async resolve(userId: string): Promise<UserProfile | null> {
    // Kiểm tra cache trước
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`[USER-RESOLVER] Cache HIT for userId: ${userId}`);
      return cached.profile;
    }

    console.log(`[USER-RESOLVER] Fetching profile for userId: ${userId} from auth-service...`);

    try {
      const response = await fetch(`${this.authServiceUrl}/internal/users/${userId}`, {
        method: 'GET',
        headers: {
          'X-Internal-Secret': this.internalSecret,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[USER-RESOLVER] User ${userId} not found in auth-service.`);
          return null;
        }
        console.error(`[USER-RESOLVER] auth-service returned ${response.status} for userId: ${userId}`);
        return null;
      }

      const profile = await response.json() as UserProfile;

      // Lưu vào cache
      this.cache.set(userId, {
        profile,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      console.log(`[USER-RESOLVER] Resolved email: ${profile.email} for userId: ${userId}`);
      return profile;
    } catch (err) {
      // Non-fatal: nếu auth-service không respond, chỉ log warning
      console.warn(`[USER-RESOLVER] Failed to fetch user profile for ${userId}:`, (err as Error).message);
      return null;
    }
  }

  /** Xóa cache của 1 user (ví dụ khi user đổi email) */
  invalidate(userId: string): void {
    this.cache.delete(userId);
  }
}

// Singleton instance
export const userEmailResolver = new UserEmailResolver();
