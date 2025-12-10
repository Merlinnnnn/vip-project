import type { UUID } from '../../shared';

export class Skill {
  constructor(
    public readonly id: UUID,
    public readonly userId: UUID,
    public name: string,
    public totalMinutes: number = 0,
    public targetMinutes: number = 600000,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}
