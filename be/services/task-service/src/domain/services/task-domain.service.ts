import { Task, TaskStatus } from '../entities/task.entity';

export class TaskDomainService {
  ensureValidStatus(status: TaskStatus) {
    const allowed: TaskStatus[] = ['todo', 'in_progress', 'done'];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
  }

  updateTask(
    task: Task,
    data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'learningMinutes' | 'skillId'>>
  ) {
    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.status !== undefined) {
      this.ensureValidStatus(data.status);
      task.status = data.status;
    }
    if (data.priority !== undefined) {
      task.priority = data.priority;
    }
    if (data.learningMinutes !== undefined) {
      if (data.learningMinutes < 0) {
        throw new Error('learningMinutes cannot be negative');
      }
      task.learningMinutes = data.learningMinutes;
    }
    if (data.skillId !== undefined) {
      task.skillId = data.skillId;
    }
    task.updatedAt = new Date();
    return task;
  }
}
