import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { IRequest, IRequestHandler } from '../../shared/mediator';
import { randomUUID } from 'crypto';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { JwtProvider } from '../../infrastructure/security/jwt-provider';
import { PasswordHasher } from '../../infrastructure/security/password-hasher';
import { RabbitMQPublisher } from '../../infrastructure/messaging/rabbitmq.publisher';

export class RegisterCommand implements IRequest<AuthResponseDto> {
  constructor(public readonly dto: RegisterDto) {}
}

export class RegisterHandler implements IRequestHandler<RegisterCommand, AuthResponseDto> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtProvider: JwtProvider,
    private readonly publisher?: RabbitMQPublisher
  ) {}

  async handle(command: RegisterCommand): Promise<AuthResponseDto> {
    const { dto } = command;
    const existing = await this.userRepository.findByEmail(dto.email);
    this.userDomainService.ensureEmailAvailable(existing, dto.email);

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const refresh = this.jwtProvider.generateRefreshToken();
    const user = await this.userRepository.create(
      new User(randomUUID(), dto.email, dto.name?.trim() || null, passwordHash, new Date(), refresh.token, refresh.expiresAt)
    );

    // Publish user.registered event lên RabbitMQ (fire-and-forget)
    void this.publisher?.publish('user.registered', {
      userId: user.id,
      email: user.email,
      name: user.name ?? user.email.split('@')[0],
      registeredAt: new Date().toISOString(),
    });

    const accessToken = this.jwtProvider.sign({ sub: user.id, email: user.email });
    return new AuthResponseDto(accessToken, refresh.token, { id: user.id, email: user.email, name: user.name });
  }
}
