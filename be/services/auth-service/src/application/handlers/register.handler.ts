import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { IRequest, IRequestHandler } from '../../shared/mediator';
import { randomUUID } from 'crypto';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { JwtProvider } from '../../infrastructure/security/jwt-provider';
import { PasswordHasher } from '../../infrastructure/security/password-hasher';

export class RegisterCommand implements IRequest<AuthResponseDto> {
  constructor(public readonly dto: RegisterDto) {}
}

export class RegisterHandler implements IRequestHandler<RegisterCommand, AuthResponseDto> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtProvider: JwtProvider
  ) {}

  async handle(command: RegisterCommand): Promise<AuthResponseDto> {
    const { dto } = command;
    const existing = await this.userRepository.findByEmail(dto.email);
    this.userDomainService.ensureEmailAvailable(existing, dto.email);

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const refresh = this.jwtProvider.generateRefreshToken();
    
    const userId = randomUUID();
    const email = dto.email;
    const name = dto.name?.trim() || null;
    const registeredAt = new Date();

    const user = await this.userRepository.createWithOutboxEvent(
      new User(userId, email, name, passwordHash, registeredAt, refresh.token, refresh.expiresAt),
      {
        routingKey: 'user.registered',
        payload: {
          userId,
          email,
          name: name ?? email.split('@')[0],
          registeredAt: registeredAt.toISOString(),
        }
      }
    );

    const accessToken = this.jwtProvider.sign({ sub: user.id, email: user.email });
    return new AuthResponseDto(accessToken, refresh.token, { id: user.id, email: user.email, name: user.name });
  }
}
