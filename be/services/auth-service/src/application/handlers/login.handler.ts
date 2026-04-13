import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { IRequest, IRequestHandler } from '../../shared/mediator';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordHasher } from '../../infrastructure/security/password-hasher';
import { JwtProvider } from '../../infrastructure/security/jwt-provider';

export class LoginCommand implements IRequest<AuthResponseDto> {
  constructor(public readonly dto: LoginDto) {}
}

export class LoginHandler implements IRequestHandler<LoginCommand, AuthResponseDto> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtProvider: JwtProvider
  ) {}

  async handle(command: LoginCommand): Promise<AuthResponseDto> {
    const { dto } = command;
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const match = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new Error('Invalid credentials');
    }

    const refresh = this.jwtProvider.generateRefreshToken();
    user.refreshToken = refresh.token;
    user.refreshTokenExpiresAt = refresh.expiresAt;
    await this.userRepository.update(user);

    const accessToken = this.jwtProvider.sign({ sub: user.id, email: user.email });
    return new AuthResponseDto(accessToken, refresh.token, { id: user.id, email: user.email });
  }
}
