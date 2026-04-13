import { IRequest, IRequestHandler } from '../../shared/mediator';
import { SkillRepository } from '../../domain/repositories/skill.repository';
import { CreateSkillDto } from '../dto/create-skill.dto';
import { Skill } from '../../domain/entities/skill.entity';
import { UUID } from '../../shared';
import { randomUUID } from 'crypto';

// Commands & Queries
export class CreateSkillCommand implements IRequest<Skill> {
  constructor(public readonly userId: UUID, public readonly dto: CreateSkillDto) {}
}

export class UpdateSkillCommand implements IRequest<Skill> {
  constructor(public readonly userId: UUID, public readonly id: UUID, public readonly data: { name?: string; targetMinutes?: number }) {}
}

export class DeleteSkillCommand implements IRequest<void> {
  constructor(public readonly userId: UUID, public readonly id: UUID) {}
}

export class ListSkillsQuery implements IRequest<Skill[]> {
  constructor(public readonly userId: UUID) {}
}

// Handlers
export class CreateSkillHandler implements IRequestHandler<CreateSkillCommand, Skill> {
  constructor(private readonly repo: SkillRepository) {}

  async handle(command: CreateSkillCommand): Promise<Skill> {
    const { userId, dto } = command;
    if (!dto.name?.trim()) {
      throw new Error('Skill name is required');
    }
    const targetMinutes = dto.targetMinutes === undefined ? 600000 : Number(dto.targetMinutes);
    if (Number.isNaN(targetMinutes) || targetMinutes <= 0) {
      throw new Error('targetMinutes must be a positive number');
    }
    const skill = new Skill(
      randomUUID(),
      userId,
      dto.name.trim(),
      0,
      targetMinutes
    );
    return this.repo.create(skill);
  }
}

export class UpdateSkillHandler implements IRequestHandler<UpdateSkillCommand, Skill> {
  constructor(private readonly repo: SkillRepository) {}

  async handle(command: UpdateSkillCommand): Promise<Skill> {
    const { userId, id, data } = command;
    const skill = await this.repo.findById(id, userId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    if (data.name !== undefined) {
      if (!data.name.trim()) throw new Error('Skill name is required');
      skill.name = data.name.trim();
    }
    if (data.targetMinutes !== undefined) {
      const parsed = Number(data.targetMinutes);
      if (Number.isNaN(parsed) || parsed <= 0) {
        throw new Error('targetMinutes must be positive');
      }
      skill.targetMinutes = parsed;
    }
    return this.repo.update(skill);
  }
}

export class DeleteSkillHandler implements IRequestHandler<DeleteSkillCommand, void> {
  constructor(private readonly repo: SkillRepository) {}

  async handle(command: DeleteSkillCommand): Promise<void> {
    const { userId, id } = command;
    const skill = await this.repo.findById(id, userId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    await this.repo.delete(id, userId);
  }
}

export class ListSkillsHandler implements IRequestHandler<ListSkillsQuery, Skill[]> {
  constructor(private readonly repo: SkillRepository) {}

  async handle(query: ListSkillsQuery): Promise<Skill[]> {
    return this.repo.findAllByUser(query.userId);
  }
}
