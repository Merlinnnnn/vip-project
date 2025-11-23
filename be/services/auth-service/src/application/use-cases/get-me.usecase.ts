import { UserRepository } from '../../domain/repositories/user.repository';

export class GetMeUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return { id: user.id, email: user.email };
  }
}
