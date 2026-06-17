import { UserRepository } from '../../domain/repositories/user.repository';
import { IRequest, IRequestHandler } from '../../shared/mediator';

export class GetMeQuery implements IRequest<any> {
  constructor(public readonly userId: string) {}
}

export class GetMeHandler implements IRequestHandler<GetMeQuery, any> {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(query: GetMeQuery): Promise<any> {
    const user = await this.userRepository.findById(query.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return { id: user.id, email: user.email, name: user.name ?? null };
  }
}
