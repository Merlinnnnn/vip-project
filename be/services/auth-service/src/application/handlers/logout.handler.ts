import { UserRepository } from '../../domain/repositories/user.repository';
import { IRequest, IRequestHandler } from '../../shared/mediator';

export class LogoutCommand implements IRequest<void> {
  constructor(public readonly refreshToken: string) {}
}

export class LogoutHandler implements IRequestHandler<LogoutCommand, void> {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(command: LogoutCommand): Promise<void> {
    const user = await this.userRepository.findByRefreshToken(command.refreshToken);
    if (!user) {
      // Token không tồn tại trong DB → coi như đã logout, không cần báo lỗi
      return;
    }

    user.refreshToken = null;
    user.refreshTokenExpiresAt = null;
    await this.userRepository.update(user);
  }
}
