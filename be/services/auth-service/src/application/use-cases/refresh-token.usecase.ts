import { UserRepository } from '../../domain/repositories/user.repository';
import { JwtProvider } from '../../infrastructure/security/jwt-provider';
import { AuthResponseDto } from '../dto/auth-response.dto';

export class RefreshTokenUseCase {
  constructor(private readonly userRepository: UserRepository, private readonly jwtProvider: JwtProvider) {}

  async execute(refreshToken: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByRefreshToken(refreshToken);
    if (!user || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
      throw new Error('Invalid refresh token');
    }
    const newAccess = this.jwtProvider.sign({ sub: user.id, email: user.email });
    const newRefresh = this.jwtProvider.generateRefreshToken();
    user.refreshToken = newRefresh.token;
    user.refreshTokenExpiresAt = newRefresh.expiresAt;
    await this.userRepository.update(user);
    return new AuthResponseDto(newAccess, newRefresh.token, { id: user.id, email: user.email });
  }
}
