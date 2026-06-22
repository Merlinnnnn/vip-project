import { Router, Request, Response } from 'express';
import { UserRepository } from '../../domain/repositories/user.repository';

/**
 * InternalController — endpoint nội bộ dành cho các service khác trong cùng Docker network.
 *
 * KHÔNG expose qua Nginx ra ngoài internet.
 * Bảo vệ bằng X-Internal-Secret header để ngăn service khác gọi tùy ý.
 *
 * Route: GET /internal/users/:userId
 * Response: { id, email, name }
 */
export class InternalController {
  public readonly router: Router;
  private readonly secret: string;

  constructor(
    private readonly userRepository: UserRepository,
  ) {
    this.router = Router();
    this.secret = process.env.INTERNAL_SECRET ?? 'vip-internal-secret-change-in-prod';
    this.router.get('/users/:userId', this.verifySecret, this.getUserById);
  }

  /** Middleware: kiểm tra X-Internal-Secret header */
  private verifySecret = (req: Request, res: Response, next: () => void) => {
    const provided = req.header('X-Internal-Secret');
    if (provided !== this.secret) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };

  /** GET /internal/users/:userId — trả về email + name của user */
  private getUserById = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await this.userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      // Chỉ trả về thông tin cần thiết, KHÔNG trả về passwordHash hay refreshToken
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (err) {
      console.error('[INTERNAL] Error fetching user:', err);
      res.status(500).json({ message: 'Internal error' });
    }
  };
}
