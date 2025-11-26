import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import type { UUID } from '../../shared';
import { prisma } from './prisma/prisma.client';

function mapToDomain(task: any): Task {
  return new Task(
    task.id,
    task.userId,
    task.title,
    task.description ?? null,
    task.status,
    task.priority,
    task.createdAt,
    task.updatedAt
  );
}

export class PrismaTaskRepository extends TaskRepository {
  async findAllByUser(userId: UUID): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { userId },
      // cast to any to allow using fresh priority field even if prisma types are stale
      orderBy: { priority: 'desc' } as any
    });
    return tasks.map(mapToDomain);
  }

  async findById(id: UUID, userId: UUID): Promise<Task | null> {
    const task = await prisma.task.findFirst({ where: { id, userId } });
    return task ? mapToDomain(task) : null;
  }

  async create(task: Task): Promise<Task> {
    const created = await prisma.task.create({
      data: {
        id: task.id,
        userId: task.userId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority
      } as any
    });
    return mapToDomain(created);
  }

  async update(task: Task): Promise<Task> {
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority
      } as any
    });
    return mapToDomain(updated);
  }

  async delete(id: UUID, userId: UUID): Promise<void> {
    await prisma.task.deleteMany({ where: { id, userId } });
  }
}
