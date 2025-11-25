import { Router, type Request, type Response, type NextFunction } from 'express';
import { TokenStore } from '../../infrastructure/cache/token.store';

export class AuthController {
  public readonly router: Router;

  constructor(private readonly tokenStore: TokenStore) {
    this.router = Router();
    this.router.post('/tokens', this.saveTokens);
    this.router.get('/tokens/:userId', this.getTokensForUser);
    this.router.post('/tokens/verify', this.verifyAccessToken);
    this.router.delete('/tokens/:userId', this.revokeTokens);
  }

  private saveTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, accessToken, refreshToken } = req.body ?? {};

      if (!userId || !accessToken || !refreshToken) {
        res.status(400).json({ message: 'userId, accessToken and refreshToken are required' });
        return;
      }

      await this.tokenStore.saveTokens(userId, accessToken, refreshToken);
      res.status(201).json({ message: 'Tokens stored' });
    } catch (err) {
      next(err);
    }
  };

  private getTokensForUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const tokens = await this.tokenStore.getTokensForUser(userId);
      if (!tokens.accessToken && !tokens.refreshToken) {
        res.status(404).json({ message: 'No tokens found for user' });
        return;
      }

      res.json(tokens);
    } catch (err) {
      next(err);
    }
  };

  private verifyAccessToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accessToken } = req.body ?? {};
      if (!accessToken) {
        res.status(400).json({ message: 'accessToken is required' });
        return;
      }

      const userId = await this.tokenStore.getUserIdByAccessToken(accessToken);
      if (!userId) {
        res.status(401).json({ message: 'Invalid or expired access token' });
        return;
      }

      res.json({ userId });
    } catch (err) {
      next(err);
    }
  };

  private revokeTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      await this.tokenStore.revokeUserTokens(userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
