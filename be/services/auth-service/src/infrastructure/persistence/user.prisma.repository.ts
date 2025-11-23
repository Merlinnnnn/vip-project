import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { prisma } from './prisma/prisma.client';

type PrismaUser = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

function mapToDomain(user: PrismaUser): User {
  return new User(
    user.id,
    user.email,
    user.passwordHash,
    user.createdAt,
    user.refreshToken,
    user.refreshTokenExpiresAt ?? null
  );
}

export class PrismaUserRepository extends UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? mapToDomain(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapToDomain(user) : null;
  }

  async findByRefreshToken(token: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { refreshToken: token } });
    return user ? mapToDomain(user) : null;
  }

  async create(user: User): Promise<User> {
    const created = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
        refreshToken: user.refreshToken,
        refreshTokenExpiresAt: user.refreshTokenExpiresAt
      }
    });
    return mapToDomain(created);
  }

  async update(user: User): Promise<User> {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
        refreshToken: user.refreshToken,
        refreshTokenExpiresAt: user.refreshTokenExpiresAt
      }
    });
    return mapToDomain(updated);
  }
}
