import { Mediator } from '../../shared/mediator';
import { TaskScheduledEvent } from '../events/task-events';
import { NotificationQueueService } from '../../infrastructure/queue/bullmq.infrastructure';

export class DelayedNotificationHandler {
  constructor(
    private readonly mediator: Mediator,
    private readonly queueService: NotificationQueueService
  ) {
    // Subscribe to task scheduling events
    this.mediator.subscribe(TaskScheduledEvent, this.handle.bind(this));
  }

  private async handle(event: TaskScheduledEvent) {
    // Skip if it's already an alarm (to avoid loops)
    if (event.title.startsWith('[ALARM]')) return;

    const dueDate = new Date(event.dueDate);
    const now = new Date();
    
    // Calculate delay. For proof of concept, we can subtract 15 minutes if needed.
    // However, if the user says "15 mins from now", the dueDate passed in should reflect that.
    // For now, we'll just target the exact dueDate.
    const delayMs = dueDate.getTime() - now.getTime();

    await this.queueService.scheduleNotification({
      taskId: event.taskId,
      userId: event.userId,
      title: event.title,
      dueDate: event.dueDate
    }, delayMs);
  }
}
