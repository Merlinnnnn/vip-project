import { IRequest, IRequestHandler, Mediator } from '../../shared/mediator';
import { TaskScheduledEvent } from '../events/task-events';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { SkillRepository } from '../../domain/repositories/skill.repository';
import { TaskDomainService } from '../../domain/services/task-domain.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { Task } from '../../domain/entities/task.entity';
import { UUID } from '../../shared';
import { randomUUID } from 'crypto';
import { NotificationQueueService } from '../../infrastructure/queue/bullmq.infrastructure';

// Commands & Queries
export class CreateTaskCommand implements IRequest<Task> {
  constructor(public readonly userId: UUID, public readonly dto: CreateTaskDto) { }
}

export class UpdateTaskCommand implements IRequest<Task> {
  constructor(public readonly userId: UUID, public readonly id: UUID, public readonly dto: UpdateTaskDto) { }
}

export class DeleteTaskCommand implements IRequest<void> {
  constructor(public readonly userId: UUID, public readonly id: UUID) { }
}

export class ListTasksQuery implements IRequest<Task[]> {
  constructor(public readonly userId: UUID) { }
}

export class GetTaskQuery implements IRequest<Task> {
  constructor(public readonly userId: UUID, public readonly id: UUID) { }
}

// Handlers

export class CreateTaskHandler implements IRequestHandler<CreateTaskCommand, Task> {
  constructor(
    private readonly repo: TaskRepository,
    private readonly domain: TaskDomainService,
    private readonly mediator: Mediator,
    private readonly skills?: SkillRepository
  ) { }

  async handle(command: CreateTaskCommand): Promise<Task> {
    const { userId, dto } = command;
    const status = dto.status ?? 'todo';
    if (!dto.dueDate) {
      throw new Error('dueDate is required');
    }
    const dueDate = this.domain.ensureDueDate(dto.dueDate);
    const learningMinutes = dto.learningMinutes === undefined ? 0 : Number(dto.learningMinutes);
    if (Number.isNaN(learningMinutes) || learningMinutes < 0) {
      throw new Error('learningMinutes cannot be negative');
    }
    const skillId = dto.skillId ?? null;
    if (skillId && this.skills) {
      const skill = await this.skills.findById(skillId, userId);
      if (!skill) {
        throw new Error('Skill not found for this user');
      }
    }

    const task = new Task(
      randomUUID(),
      userId,
      dto.title,
      dto.description ?? null,
      status,
      dto.priority ?? Date.now(),
      learningMinutes,
      dueDate,
      skillId
    );
    this.domain.ensureValidStatus(task.status);
    this.domain.enforceStatusForDueDate(task);
    const created = await this.repo.createWithOutbox(task);

    // Publish scheduling event
    void this.mediator.publish(new TaskScheduledEvent(created.id, created.userId!, created.title, created.dueDate.toISOString()));

    return created;
  }
}

export class UpdateTaskHandler implements IRequestHandler<UpdateTaskCommand, Task> {
  constructor(
    private readonly repo: TaskRepository,
    private readonly domain: TaskDomainService,
    private readonly mediator: Mediator,
    private readonly skills?: SkillRepository
  ) { }

  async handle(command: UpdateTaskCommand): Promise<Task> {
    const { userId, id, dto } = command;
    const task = await this.repo.findById(id, userId);
    if (!task) {
      throw new Error('Task not found');
    }
    const previousDueDateString = task.dueDate;
    const previousSkillId = task.skillId ?? null;
    const previousMinutes = task.learningMinutes ?? 0;
    const parsedLearningMinutes =
      dto.learningMinutes === undefined ? undefined : Number(dto.learningMinutes);
    if (parsedLearningMinutes !== undefined && (Number.isNaN(parsedLearningMinutes) || parsedLearningMinutes < 0)) {
      throw new Error('learningMinutes cannot be negative');
    }
    const parsedDueDate = dto.dueDate === undefined ? undefined : this.domain.ensureDueDate(dto.dueDate);
    const nextSkillId = dto.skillId ?? previousSkillId;
    if (nextSkillId && this.skills) {
      const skill = await this.skills.findById(nextSkillId, userId);
      if (!skill) {
        throw new Error('Skill not found for this user');
      }
    }
    this.domain.updateTask(task, { ...dto, learningMinutes: parsedLearningMinutes, dueDate: parsedDueDate });
    const updated = await this.repo.updateWithOutbox(task, previousSkillId, previousMinutes);

    if (updated.dueDate.getTime() !== new Date(previousDueDateString).getTime()) {
      void this.mediator.publish(new TaskScheduledEvent(updated.id, updated.userId!, updated.title, updated.dueDate.toISOString()));
    }

    return updated;
  }
}

export class DeleteTaskHandler implements IRequestHandler<DeleteTaskCommand, void> {
  constructor(
    private readonly repo: TaskRepository,
    private readonly skills?: SkillRepository,
    private readonly queue?: NotificationQueueService
  ) { }

  async handle(command: DeleteTaskCommand): Promise<void> {
    const { userId, id } = command;
    const task = await this.repo.findById(id, userId);
    if (!task) {
      throw new Error('Task not found');
    }
    await this.repo.delete(id, userId);
    // Cancel pending BullMQ notification để tránh ghost notification
    await this.queue?.cancelNotification(id);
    if (this.skills && task.skillId && task.learningMinutes) {
      await this.skills.incrementTotalMinutes(task.skillId, userId, -task.learningMinutes);
    }
  }
}

export class ListTasksHandler implements IRequestHandler<ListTasksQuery, Task[]> {
  constructor(private readonly repo: TaskRepository) { }

  async handle(query: ListTasksQuery): Promise<Task[]> {
    return this.repo.findAllByUser(query.userId);
  }
}

export class GetTaskHandler implements IRequestHandler<GetTaskQuery, Task> {
  constructor(private readonly repo: TaskRepository) { }

  async handle(query: GetTaskQuery): Promise<Task> {
    const task = await this.repo.findById(query.id, query.userId);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }
}
