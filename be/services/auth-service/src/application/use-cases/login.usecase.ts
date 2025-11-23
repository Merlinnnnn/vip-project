import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordHasher } from '../../infrastructure/security/password-hasher';
import { JwtProvider } from '../../infrastructure/security/jwt-provider';

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtProvider: JwtProvider
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const match = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.jwtProvider.sign({ sub: user.id, email: user.email });
    return new AuthResponseDto(accessToken, { id: user.id, email: user.email });
  }
}
