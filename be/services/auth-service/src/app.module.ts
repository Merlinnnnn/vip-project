import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AuthController } from './interfaces/rest/auth.controller';
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { GetMeUseCase } from './application/use-cases/get-me.usecase';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { UserDomainService } from './domain/services/user-domain.service';
import { PasswordHasher } from './infrastructure/security/password-hasher';
import { JwtProvider } from './infrastructure/security/jwt-provider';
import { PrismaUserRepository } from './infrastructure/persistence/user.prisma.repository';

export function createApp() {
  const app = express();
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  app.use(
    cors({
      origin,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // Basic anti-scripted-clients guard: require browser-like Origin/Fetch headers
  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const secFetchSite = req.headers['sec-fetch-site'] as string | undefined;
    if (requestOrigin && requestOrigin !== origin) {
      return res.status(403).json({ message: 'Origin not allowed' });
    }
    if (!requestOrigin && !secFetchSite) {
      return res.status(403).json({ message: 'Origin header required' });
    }
    next();
  });

  // Request logger (simple)
  app.use((req, _res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Manual DI wiring
  const userRepository = new PrismaUserRepository();
  const passwordHasher = new PasswordHasher();
  const jwtProvider = new JwtProvider();
  const userDomainService = new UserDomainService();

  const registerUseCase = new RegisterUseCase(
    userRepository,
    userDomainService,
    passwordHasher,
    jwtProvider
  );
  const loginUseCase = new LoginUseCase(userRepository, passwordHasher, jwtProvider);
  const getMeUseCase = new GetMeUseCase(userRepository);
  const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, jwtProvider);

  const authController = new AuthController(
    registerUseCase,
    loginUseCase,
    getMeUseCase,
    refreshTokenUseCase,
    jwtProvider
  );
  app.use('/api/auth', authController.router);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Error handler
  app.use(
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('[ERROR]', err);
      const status = err?.statusCode || 400;
      res.status(status).json({ message: err?.message || 'Unexpected error' });
    }
  );

  return app;
}
