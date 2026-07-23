import type { Request, Response, NextFunction } from 'express';
import { TokenStore } from '../cache/token.store';

/**
 * Resolve `userId` from the incoming request.
 *
 * Priority:
 *  1. `x-user-id` header  (set by Nginx / gateway)
 *  2. `Authorization: Bearer <token>` → lookup via TokenStore
 *
 * On success the resolved userId is attached to `res.locals.userId`.
 * On failure an appropriate 4xx response is sent.
 */
export function createAuthMiddleware(tokenStore: TokenStore) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. Fast path — gateway already resolved the user
    const headerUserId = req.header('x-user-id');
    if (headerUserId) {
      res.locals.userId = headerUserId;
      return next();
    }

    // 2. Bearer token lookup
    const bearer = req.header('authorization')?.replace(/^Bearer\s*/i, '').trim();
    if (bearer && tokenStore) {
      const resolved = await tokenStore.getUserIdByAccessToken(bearer);
      if (resolved) {
        res.locals.userId = resolved;
        return next();
      }
      res.status(401).json({ message: 'Invalid or expired bearer token' });
      return;
    }

    res.status(400).json({ message: 'Missing x-user-id or bearer token' });
  };
}
