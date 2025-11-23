import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { prisma } from './prisma/prisma.client';

type PrismaUser = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

function mapToDomain(user: PrismaUser): User {
  return new User(user.id, user.email, user.passwordHash, user.createdAt);
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

  async create(user: User): Promise<User> {
    const created = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt
      }
    });
    return mapToDomain(created);
  }
}
