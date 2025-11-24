import { TaskRepository } from '../../domain/repositories/task.repository';

export class ListTasksUseCase {
  constructor(private readonly repo: TaskRepository) {}

  async execute() {
    return this.repo.findAll();
  }
}
