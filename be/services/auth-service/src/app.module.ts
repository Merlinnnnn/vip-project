import express from 'express';
import cors from 'cors';
import { AuthController } from './interfaces/rest/auth.controller';
import { UserDomainService } from './domain/services/user-domain.service';
import { PasswordHasher } from './infrastructure/security/password-hasher';
import { JwtProvider } from './infrastructure/security/jwt-provider';
import { PrismaUserRepository } from './infrastructure/persistence/user.prisma.repository';
import { Mediator } from './shared/mediator';
import { RegisterCommand, RegisterHandler } from './application/handlers/register.handler';
import { LoginCommand, LoginHandler } from './application/handlers/login.handler';
import { GetMeQuery, GetMeHandler } from './application/handlers/get-me.query';
import { RefreshTokenCommand, RefreshTokenHandler } from './application/handlers/refresh-token.handler';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

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

  // Mediator setup
  const mediator = new Mediator();

  mediator.register(
    RegisterCommand,
    new RegisterHandler(userRepository, userDomainService, passwordHasher, jwtProvider)
  );
  mediator.register(
    LoginCommand,
    new LoginHandler(userRepository, passwordHasher, jwtProvider)
  );
  mediator.register(GetMeQuery, new GetMeHandler(userRepository));
  mediator.register(RefreshTokenCommand, new RefreshTokenHandler(userRepository, jwtProvider));

  const authController = new AuthController(mediator);
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
