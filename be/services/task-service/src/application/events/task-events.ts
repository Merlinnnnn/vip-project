import { INotification } from '../../shared/mediator';
import { UUID } from '../../shared';

export class TaskScheduledEvent implements INotification {
  constructor(
    public readonly taskId: UUID,
    public readonly userId: UUID,
    public readonly title: string,
    public readonly dueDate: string
  ) {}
}
