import { randomUUID } from 'crypto';
import { RegisterUseCase } from '../src/application/use-cases/register.usecase';
import { LoginUseCase } from '../src/application/use-cases/login.usecase';
import { RefreshTokenUseCase } from '../src/application/use-cases/refresh-token.usecase';
import { UserDomainService } from '../src/domain/services/user-domain.service';
import { InMemoryUserRepository } from '../src/infrastructure/persistence/user.inmemory.repository';
import { PasswordHasher } from '../src/infrastructure/security/password-hasher';
import { JwtProvider } from '../src/infrastructure/security/jwt-provider';

describe('Auth use-cases (in-memory)', () => {
  const makeDeps = () => {
    const repo = new InMemoryUserRepository();
    const hasher = new PasswordHasher();
    const jwt = new JwtProvider();
    const domain = new UserDomainService();
    return { repo, hasher, jwt, domain };
  };

  it('registers a user and returns access/refresh tokens', async () => {
    const { repo, hasher, jwt, domain } = makeDeps();
    const register = new RegisterUseCase(repo, domain, hasher, jwt);
    const res = await register.execute({ email: 'a@test.com', password: '123456' });
    expect(res.accessToken).toBeTruthy();
    expect(res.refreshToken).toBeTruthy();
    expect(res.user.email).toBe('a@test.com');
    const saved = await repo.findByEmail('a@test.com');
    expect(saved?.refreshToken).toBe(res.refreshToken);
  });

  it('rejects duplicate email', async () => {
    const { repo, hasher, jwt, domain } = makeDeps();
    const register = new RegisterUseCase(repo, domain, hasher, jwt);
    await register.execute({ email: 'dup@test.com', password: 'pw' });
    await expect(register.execute({ email: 'dup@test.com', password: 'pw2' })).rejects.toThrow(
      /already in use/i
    );
  });

  it('logs in and rotates refresh token', async () => {
    const { repo, hasher, jwt, domain } = makeDeps();
    const register = new RegisterUseCase(repo, domain, hasher, jwt);
    const login = new LoginUseCase(repo, hasher, jwt);
    const first = await register.execute({ email: 'b@test.com', password: '123' });
    const second = await login.execute({ email: 'b@test.com', password: '123' });
    expect(second.refreshToken).not.toBe(first.refreshToken);
    const saved = await repo.findByEmail('b@test.com');
    expect(saved?.refreshToken).toBe(second.refreshToken);
  });

  it('refreshes tokens when refresh token is valid', async () => {
    const { repo, hasher, jwt, domain } = makeDeps();
    const register = new RegisterUseCase(repo, domain, hasher, jwt);
    const refresh = new RefreshTokenUseCase(repo, jwt);
    const initial = await register.execute({ email: 'c@test.com', password: '123' });
    const refreshed = await refresh.execute(initial.refreshToken);
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.refreshToken).not.toBe(initial.refreshToken);
    const saved = await repo.findByEmail('c@test.com');
    expect(saved?.refreshToken).toBe(refreshed.refreshToken);
  });

  it('fails refresh when token unknown or expired', async () => {
    const { repo, hasher, jwt, domain } = makeDeps();
    const register = new RegisterUseCase(repo, domain, hasher, jwt);
    const refresh = new RefreshTokenUseCase(repo, jwt);
    const initial = await register.execute({ email: 'd@test.com', password: '123' });
    // invalidate stored token
    const saved = await repo.findByEmail('d@test.com');
    if (saved) {
      saved.refreshTokenExpiresAt = new Date(Date.now() - 1000);
      await repo.update(saved);
    }
    await expect(refresh.execute(initial.refreshToken)).rejects.toThrow(/invalid refresh token/i);
    await expect(refresh.execute(randomUUID())).rejects.toThrow(/invalid refresh token/i);
  });
});
