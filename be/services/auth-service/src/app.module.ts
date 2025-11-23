import express from 'express';
import { AuthController } from './interfaces/rest/auth.controller';
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { GetMeUseCase } from './application/use-cases/get-me.usecase';
import { UserDomainService } from './domain/services/user-domain.service';
import { PasswordHasher } from './infrastructure/security/password-hasher';
import { JwtProvider } from './infrastructure/security/jwt-provider';
import { InMemoryUserRepository } from './infrastructure/persistence/user.inmemory.repository';

export function createApp() {
  const app = express();
  app.use(express.json());

  // Manual DI wiring
  const userRepository = new InMemoryUserRepository();
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

  const authController = new AuthController(registerUseCase, loginUseCase, getMeUseCase);
  app.use('/api/auth', authController.router);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}
