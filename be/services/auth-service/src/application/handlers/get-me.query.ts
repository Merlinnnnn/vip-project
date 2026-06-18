import { UserRepository } from '../../domain/repositories/user.repository';
import { IRequest, IRequestHandler } from '../../shared/mediator';
import { userProfileCache } from '../../infrastructure/cache/user-profile.cache';

export class GetMeQuery implements IRequest<any> {
  constructor(public readonly userId: string) {}
}

export class GetMeHandler implements IRequestHandler<GetMeQuery, any> {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(query: GetMeQuery): Promise<any> {
    // 1. Thử cache trước
    const cached = await userProfileCache.get(query.userId);
    if (cached) {
      return cached;
    }

    // 2. MISS → query DB
    const user = await this.userRepository.findById(query.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const profile = { id: user.id, email: user.email, name: user.name ?? null };

    // 3. Fill vào cache cho lần sau
    await userProfileCache.set(profile);

    return profile;
  }
}
