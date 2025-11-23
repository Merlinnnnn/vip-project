import { randomUUID } from 'crypto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserDomainService } from '../../domain/services/user-domain.service';
import { JwtProvider } from '../../infrastructure/security/jwt-provider';
import { PasswordHasher } from '../../infrastructure/security/password-hasher';

export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtProvider: JwtProvider
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    this.userDomainService.ensureEmailAvailable(existing, dto.email);

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = await this.userRepository.create(
      new User(randomUUID(), dto.email, passwordHash)
    );

    const accessToken = this.jwtProvider.sign({ sub: user.id, email: user.email });
    return new AuthResponseDto(accessToken, { id: user.id, email: user.email });
  }
}
