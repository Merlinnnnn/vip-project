import type { TaskStatus } from '../../domain/entities/task.entity';

export type UpdateTaskDto = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: number;
  learningMinutes?: number;
  dueDate?: string | Date;
  skillId?: string | null;
};
