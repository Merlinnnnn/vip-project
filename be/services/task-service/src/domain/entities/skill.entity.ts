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
  
  get level(): number {
    return Math.floor(Math.sqrt(this.totalMinutes / 10)) + 1;
  }

  get currentExp(): number {
    const currentLevelBase = Math.pow(this.level - 1, 2) * 10;
    return this.totalMinutes - currentLevelBase;
  }

  get expToNextLevel(): number {
    const nextLevelBase = Math.pow(this.level, 2) * 10;
    const currentLevelBase = Math.pow(this.level - 1, 2) * 10;
    return nextLevelBase - currentLevelBase;
  }

  get rank(): string {
    const lvl = this.level;
    if (lvl >= 50) return 'Legend';
    if (lvl >= 30) return 'Master';
    if (lvl >= 20) return 'Expert';
    if (lvl >= 10) return 'Veteran';
    if (lvl >= 5) return 'Adventurer';
    return 'Novice';
  }
}
