import { Router, Request, Response, NextFunction } from 'express';
import { RegisterDto } from '../../application/dto/register.dto';
import { LoginDto } from '../../application/dto/login.dto';
import { RegisterUseCase } from '../../application/use-cases/register.usecase';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { GetMeUseCase } from '../../application/use-cases/get-me.usecase';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.usecase';

export class AuthController {
  public readonly router: Router;

  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase
  ) {
    this.router = Router();
    this.router.post('/register', this.register);
    this.router.post('/login', this.login);
    this.router.get('/me', this.me);
    this.router.post('/refresh', this.refresh);
  }

  private register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AUTH][REGISTER] request body:', req.body);
      const dto = new RegisterDto(req.body.email, req.body.password, req.body.name);
      const result = await this.registerUseCase.execute(dto);
      res.json(result);
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AUTH][LOGIN] request body:', req.body);
      const dto = new LoginDto(req.body.email, req.body.password);
      const result = await this.loginUseCase.execute(dto);
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
      const result = await this.getMeUseCase.execute(userId);
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
      const result = await this.refreshTokenUseCase.execute(refreshToken);
      res.json(result);
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private handleError(err: any, res: Response, next: NextFunction) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    let status = 400;
    if (/invalid credentials/i.test(message)) status = 401;
    if (/refresh token/i.test(message)) status = 401;
    if (/already in use/i.test(message)) status = 409;
    if (/not found/i.test(message)) status = 404;
    console.error('[AUTH][ERROR]', message);
    // If headers already sent, delegate to default error handler
    if (res.headersSent) {
      return next(err);
    }
    res.status(status).json({ message });
  }
}
