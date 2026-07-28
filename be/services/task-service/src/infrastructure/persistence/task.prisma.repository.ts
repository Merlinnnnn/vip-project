import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { TaskDomainService } from '../../domain/services/task-domain.service';
import type { UUID } from '../../shared';
import { prisma } from './prisma/prisma.client';

/** Shared domain service instance for status enforcement */
const domainService = new TaskDomainService();

function mapToDomain(task: any): Task {
  const domain = new Task(
    task.id,
    task.userId,
    task.title,
    task.description ?? null,
    task.status,
    task.priority,
    task.estimatedMinutes ?? 0,
    task.dueDate,
    task.skillId ?? null,
    task.createdAt,
    task.updatedAt
  );
  domainService.enforceStatusForDueDate(domain);
  return domain;
}


export class PrismaTaskRepository extends TaskRepository {
  async findAllByUser(userId: UUID): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }]
    });
    return tasks.map(mapToDomain);
  }

  async findById(id: UUID, userId: UUID): Promise<Task | null> {
    const task = await prisma.task.findFirst({ where: { id, userId } });
    return task ? mapToDomain(task) : null;
  }

  async create(task: Task): Promise<Task> {
    const nextPriority = await this.getNextPriority(task.userId);
    const created = await prisma.task.create({
      data: {
        id: task.id,
        userId: task.userId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: nextPriority,
        estimatedMinutes: task.estimatedMinutes,
        dueDate: task.dueDate,
        skillId: task.skillId
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
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        dueDate: task.dueDate,
        skillId: task.skillId
      } as any
    });
    await this.normalizePriorities(task.userId);
    return mapToDomain(updated);
  }

  /**
   * Create task with outbox event for due-date scheduling.
   * NOTE: No longer accumulates estimatedMinutes to Skill.totalMinutes.
   * Skill time is ONLY accumulated via WorkSession.stop().
   */
  async createWithOutbox(task: Task): Promise<Task> {
    const nextPriority = await this.getNextPriority(task.userId);

    const created = await prisma.$transaction(async (tx) => {
      const dbTask = await tx.task.create({
        data: {
          id: task.id,
          userId: task.userId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: nextPriority,
          estimatedMinutes: task.estimatedMinutes,
          dueDate: task.dueDate,
          skillId: task.skillId
        } as any
      });

      return dbTask;
    });

    return mapToDomain(created);
  }

  /**
   * Update task with outbox event.
   * NOTE: No longer adjusts Skill.totalMinutes — that's WorkSession's job.
   */
  async updateWithOutbox(
    task: Task,
    _previousSkillId: UUID | null,
    _previousMinutes: number
  ): Promise<Task> {
    const updated = await prisma.$transaction(async (tx) => {
      const dbTask = await tx.task.update({
        where: { id: task.id },
        data: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          estimatedMinutes: task.estimatedMinutes,
          dueDate: task.dueDate,
          skillId: task.skillId
        } as any
      });

      return dbTask;
    });

    await this.normalizePriorities(task.userId);
    return mapToDomain(updated);
  }

  async delete(id: UUID, userId: UUID): Promise<void> {
    await prisma.task.deleteMany({ where: { id, userId } });
    await this.normalizePriorities(userId);
  }

  private async getNextPriority(userId: UUID): Promise<number> {
    const agg = await prisma.task.aggregate({
      where: { userId },
      _max: { priority: true }
    });
    const currentMax = agg._max.priority ?? 0;
    return currentMax + 1;
  }

  private async normalizePriorities(userId: UUID): Promise<void> {
    await prisma.$executeRawUnsafe(
      `
      WITH ordered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY priority, "createdAt") AS rn
        FROM "Task"
        WHERE "userId" = $1
      )
      UPDATE "Task" t
      SET priority = o.rn
      FROM ordered o
      WHERE t.id = o.id;
    `,
      userId
    );
  }
}
