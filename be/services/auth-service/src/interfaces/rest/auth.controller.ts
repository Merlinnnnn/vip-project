import { Router, Request, Response, NextFunction } from 'express';
import { RegisterDto } from '../../application/dto/register.dto';
import { LoginDto } from '../../application/dto/login.dto';
import { Mediator } from '../../shared/mediator';
import { RegisterCommand } from '../../application/handlers/register.handler';
import { LoginCommand } from '../../application/handlers/login.handler';
import { GetMeQuery } from '../../application/handlers/get-me.query';
import { RefreshTokenCommand } from '../../application/handlers/refresh-token.handler';

export class AuthController {
  public readonly router: Router;

  constructor(private readonly mediator: Mediator) {
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

  private handleError(err: any, res: Response, next: NextFunction) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    let status = 400;
    if (/invalid credentials/i.test(message)) status = 401;
    if (/refresh token/i.test(message)) status = 401;
    if (/already in use/i.test(message)) status = 409;
    if (/not found/i.test(message)) status = 404;
    console.error('[AUTH][ERROR]', message);
    if (res.headersSent) {
      return next(err);
    }
    res.status(status).json({ message });
  }
}
