import { Task, TaskStatus } from '../entities/task.entity';

export class TaskDomainService {
  ensureValidStatus(status: TaskStatus) {
    const allowed: TaskStatus[] = ['todo', 'in_progress', 'done', 'overdue'];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
  }

  ensureDueDate(value: unknown): Date {
    const parsed = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid due date');
    }
    return parsed;
  }

  enforceStatusForDueDate(task: Task) {
    if (task.status === 'done') return task;
    const now = Date.now();
    const due = task.dueDate.getTime();
    if (due < now) {
      task.status = 'overdue';
    } else if (task.status === 'overdue') {
      task.status = 'todo';
    }
    return task;
  }

  updateTask(
    task: Task,
    data: Partial<
      Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'learningMinutes' | 'skillId' | 'dueDate'>
    >
  ) {
    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.status !== undefined) {
      this.ensureValidStatus(data.status);
      task.status = data.status;
    }
    if (data.dueDate !== undefined) {
      task.dueDate = this.ensureDueDate(data.dueDate);
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
    this.enforceStatusForDueDate(task);
    task.updatedAt = new Date();
    return task;
  }
}
