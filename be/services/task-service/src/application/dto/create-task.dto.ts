import type { TaskStatus } from '../../domain/entities/task.entity';

export type CreateTaskDto = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: number;
};
