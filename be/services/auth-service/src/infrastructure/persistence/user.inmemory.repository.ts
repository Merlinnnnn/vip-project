import { randomUUID } from 'crypto';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';

export class InMemoryUserRepository extends UserRepository {
  private readonly users = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    const match = Array.from(this.users.values()).find((user) => user.email === email);
    return match ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByRefreshToken(token: string): Promise<User | null> {
    const match = Array.from(this.users.values()).find((user) => user.refreshToken === token);
    return match ?? null;
  }

  async create(user: User): Promise<User> {
    const id = user.id || randomUUID();
    const nextUser = new User(
      id,
      user.email,
      user.passwordHash,
      user.createdAt,
      user.refreshToken,
      user.refreshTokenExpiresAt
    );
    this.users.set(id, nextUser);
    return nextUser;
  }

  async update(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }
}
