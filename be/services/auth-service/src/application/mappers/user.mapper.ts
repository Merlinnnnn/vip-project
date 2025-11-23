import { User } from '../../domain/entities/user.entity';

export class UserMapper {
  static toPublic(user: User) {
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }
}
