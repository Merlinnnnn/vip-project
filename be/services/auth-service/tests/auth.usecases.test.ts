import { randomUUID } from 'crypto';
import { RegisterHandler, RegisterCommand } from '../src/application/handlers/register.handler';
import { LoginHandler, LoginCommand } from '../src/application/handlers/login.handler';
import { RefreshTokenHandler, RefreshTokenCommand } from '../src/application/handlers/refresh-token.handler';
import { UserDomainService } from '../src/domain/services/user-domain.service';
import { InMemoryUserRepository } from '../src/infrastructure/persistence/user.inmemory.repository';
import { PasswordHasher } from '../src/infrastructure/security/password-hasher';
import { JwtProvider } from '../src/infrastructure/security/jwt-provider';

describe('Auth handlers (in-memory)', () => {
  const makeDeps = () => {
    const repo = new InMemoryUserRepository();
    const hasher = new PasswordHasher();
    const jwt = new JwtProvider();
    const domain = new UserDomainService();
    return { repo, hasher, jwt, domain };
  };

  it('registers a user and returns access/refresh tokens', async () => {
    const { repo, hasher, jwt, domain } = makeDeps();
    const handler = new RegisterHandler(repo, domain, hasher, jwt);
    const res = await handler.handle(new RegisterCommand({ email: 'a@test.com', password: '123456' }));
    expect(res.accessToken).toBeTruthy();
    expect(res.refreshToken).toBeTruthy();
    expect(res.user.email).toBe('a@test.com');
    const saved = await repo.findByEmail('a@test.com');
    expect(saved?.refreshToken).toBe(res.refreshToken);
  });

  it('rejects duplicate email', async () => {
    const { repo, hasher, jwt, domain } = makeDeps();
    const handler = new RegisterHandler(repo, domain, hasher, jwt);
    await handler.handle(new RegisterCommand({ email: 'dup@test.com', password: 'pw' }));
    await expect(handler.handle(new RegisterCommand({ email: 'dup@test.com', password: 'pw2' }))).rejects.toThrow(
      /already in use/i
    );
  });

  it('logs in and rotates refresh token', async () => {
    const { repo, hasher, jwt, domain } = makeDeps();
    const register = new RegisterHandler(repo, domain, hasher, jwt);
    const login = new LoginHandler(repo, hasher, jwt);
    const first = await register.handle(new RegisterCommand({ email: 'b@test.com', password: '123' }));
    const second = await login.handle(new LoginCommand({ email: 'b@test.com', password: '123' }));
    expect(second.refreshToken).not.toBe(first.refreshToken);
    const saved = await repo.findByEmail('b@test.com');
    expect(saved?.refreshToken).toBe(second.refreshToken);
  });

  it('refreshes tokens when refresh token is valid', async () => {
    const { repo, hasher, jwt, domain } = makeDeps();
    const register = new RegisterHandler(repo, domain, hasher, jwt);
    const refresh = new RefreshTokenHandler(repo, jwt);
    const initial = await register.handle(new RegisterCommand({ email: 'c@test.com', password: '123' }));
    const refreshed = await refresh.handle(new RefreshTokenCommand(initial.refreshToken));
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.refreshToken).not.toBe(initial.refreshToken);
    const saved = await repo.findByEmail('c@test.com');
    expect(saved?.refreshToken).toBe(refreshed.refreshToken);
  });

  it('fails refresh when token unknown or expired', async () => {
    const { repo, hasher, jwt, domain } = makeDeps();
    const register = new RegisterHandler(repo, domain, hasher, jwt);
    const refresh = new RefreshTokenHandler(repo, jwt);
    const initial = await register.handle(new RegisterCommand({ email: 'd@test.com', password: '123' }));
    // invalidate stored token
    const saved = await repo.findByEmail('d@test.com');
    if (saved) {
      saved.refreshTokenExpiresAt = new Date(Date.now() - 1000);
      await repo.update(saved);
    }
    await expect(refresh.handle(new RefreshTokenCommand(initial.refreshToken))).rejects.toThrow(/invalid refresh token/i);
    await expect(refresh.handle(new RefreshTokenCommand(randomUUID()))).rejects.toThrow(/invalid refresh token/i);
  });
});
