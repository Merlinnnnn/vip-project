import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { RegisterDto } from '../../application/dto/register.dto';
import { LoginDto } from '../../application/dto/login.dto';
import { Mediator } from '../../shared/mediator';
import { RegisterCommand } from '../../application/handlers/register.handler';
import { LoginCommand } from '../../application/handlers/login.handler';
import { GetMeQuery } from '../../application/handlers/get-me.query';
import { RefreshTokenCommand } from '../../application/handlers/refresh-token.handler';
import { LogoutCommand } from '../../application/handlers/logout.handler';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication — register, login, token management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: Đăng ký thành công, trả về tokens
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email đã được sử dụng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Sai email hoặc mật khẩu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (injected by gateway)
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Thiếu x-user-id header
 *       404:
 *         description: User không tồn tại
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Token mới
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Refresh token không hợp lệ hoặc hết hạn
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất (revoke refresh token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *     responses:
 *       204:
 *         description: Đăng xuất thành công
 *       400:
 *         description: Thiếu refreshToken
 */

// ─────────────────────────────────────────────────────────
// Rate limiter middlewares được inject vào qua constructor
// → Controller không biết gì về Redis hay implementation cụ thể
// ─────────────────────────────────────────────────────────
export interface AuthRateLimiters {
  loginLimiter: RequestHandler;
  registerLimiter: RequestHandler;
  refreshLimiter: RequestHandler;
}

export class AuthController {
  public readonly router: Router;

  constructor(
    private readonly mediator: Mediator,
    private readonly rateLimiters?: AuthRateLimiters
  ) {
    this.router = Router();

    // Apply limiters trực tiếp vào từng route — không phải toàn bộ router
    if (rateLimiters) {
      this.router.post('/register', rateLimiters.registerLimiter, this.register);
      this.router.post('/login', rateLimiters.loginLimiter, this.login);
      this.router.post('/refresh', rateLimiters.refreshLimiter, this.refresh);
    } else {
      // Fallback khi không có rate limiters (ví dụ trong testing)
      this.router.post('/register', this.register);
      this.router.post('/login', this.login);
      this.router.post('/refresh', this.refresh);
    }

    // Các route này không cần rate limit
    this.router.get('/me', this.me);
    this.router.post('/logout', this.logout);
  }

  private register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AUTH][REGISTER] request body:', req.body);
      const dto = new RegisterDto(req.body.email, req.body.password, req.body.name);
      const result = await this.mediator.send(new RegisterCommand(dto));
      res.json(result);
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AUTH][LOGIN] request body:', req.body);
      const dto = new LoginDto(req.body.email, req.body.password);
      const result = await this.mediator.send(new LoginCommand(dto));
      res.json(result);
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.header('x-user-id');
      if (!userId) {
        console.warn('[AUTH][ME] missing x-user-id header');
        res.status(400).json({ message: 'Missing user id header' });
        return;
      }
      console.log('[AUTH][ME] userId:', userId);
      const result = await this.mediator.query(new GetMeQuery(userId));
      res.json(result);
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.body?.refreshToken as string | undefined;
      if (!refreshToken) {
        res.status(400).json({ message: 'Missing refreshToken' });
        return;
      }
      console.log('[AUTH][REFRESH] token received');
      const result = await this.mediator.send(new RefreshTokenCommand(refreshToken));
      res.json(result);
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.body?.refreshToken as string | undefined;
      if (!refreshToken) {
        res.status(400).json({ message: 'Missing refreshToken' });
        return;
      }
      console.log('[AUTH][LOGOUT] revoking refresh token');
      await this.mediator.send(new LogoutCommand(refreshToken));
      res.status(204).send();
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private handleError(err: any, res: Response, next: NextFunction) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    let status = 400;
    if (/invalid credentials/i.test(message)) status = 401;
    if (/refresh token/i.test(message)) status = 401;
    if (/access token/i.test(message)) status = 401;
    if (/already in use/i.test(message)) status = 409;
    if (/not found/i.test(message)) status = 404;
    console.error('[AUTH][ERROR]', message);
    if (res.headersSent) {
      return next(err);
    }
    res.status(status).json({ message });
  }
}
