import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import type { UUID } from '../../shared';
import { prisma } from './prisma/prisma.client';

function mapToDomain(task: any): Task {
  return new Task(
    task.id,
    task.title,
    task.description ?? null,
    task.status,
    task.createdAt,
    task.updatedAt
  );
}

export class PrismaTaskRepository extends TaskRepository {
  async findAll(): Promise<Task[]> {
    const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    return tasks.map(mapToDomain);
  }

  async findById(id: UUID): Promise<Task | null> {
    const task = await prisma.task.findUnique({ where: { id } });
    return task ? mapToDomain(task) : null;
  }

  async create(task: Task): Promise<Task> {
    const created = await prisma.task.create({
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status
      }
    });
    return mapToDomain(created);
  }

  async update(task: Task): Promise<Task> {
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description,
        status: task.status
      }
    });
    return mapToDomain(updated);
  }

  async delete(id: UUID): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }
}
