import { Router, Request, Response, NextFunction, CookieOptions } from 'express';
import { RegisterDto } from '../../application/dto/register.dto';
import { LoginDto } from '../../application/dto/login.dto';
import { RegisterUseCase } from '../../application/use-cases/register.usecase';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { GetMeUseCase } from '../../application/use-cases/get-me.usecase';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.usecase';
import { JwtProvider } from '../../infrastructure/security/jwt-provider';

const isProd = process.env.NODE_ENV === 'production';
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/'
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  res.cookie('refresh_token', refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', baseCookieOptions);
  res.clearCookie('refresh_token', baseCookieOptions);
}

export class AuthController {
  public readonly router: Router;

  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly jwtProvider: JwtProvider
  ) {
    this.router = Router();
    this.router.post('/register', this.register);
    this.router.post('/login', this.login);
    this.router.get('/me', this.me);
    this.router.post('/refresh', this.refresh);
    this.router.post('/logout', this.logout);
  }

  private register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AUTH][REGISTER] request body:', req.body);
      const dto = new RegisterDto(req.body.email, req.body.password, req.body.name);
      const result = await this.registerUseCase.execute(dto);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({ user: result.user });
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AUTH][LOGIN] request body:', req.body);
      const dto = new LoginDto(req.body.email, req.body.password);
      const result = await this.loginUseCase.execute(dto);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({ user: result.user });
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = this.extractAccessToken(req);
      if (!token) {
        res.status(401).json({ message: 'Missing access token' });
        return;
      }
      const payload = this.jwtProvider.verify(token);
      const result = await this.getMeUseCase.execute(payload.sub);
      res.json(result);
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken =
        (req.cookies?.refresh_token as string | undefined) ||
        (req.body?.refreshToken as string | undefined);
      if (!refreshToken) {
        res.status(400).json({ message: 'Missing refresh token' });
        return;
      }
      console.log('[AUTH][REFRESH] token received');
      const result = await this.refreshTokenUseCase.execute(refreshToken);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({ user: result.user });
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      clearAuthCookies(res);
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
    if (/already in use/i.test(message)) status = 409;
    if (/not found/i.test(message)) status = 404;
    console.error('[AUTH][ERROR]', message);
    // If headers already sent, delegate to default error handler
    if (res.headersSent) {
      return next(err);
    }
    res.status(status).json({ message });
  }

  private extractAccessToken(req: Request): string | undefined {
    const bearer = req.headers.authorization;
    if (bearer?.startsWith('Bearer ')) {
      return bearer.substring('Bearer '.length);
    }
    if (req.cookies?.access_token) {
      return req.cookies.access_token as string;
    }
    return undefined;
  }
}
