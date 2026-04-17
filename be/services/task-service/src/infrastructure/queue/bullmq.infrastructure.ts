import { Queue, Worker, Job } from 'bullmq';
import { IRedisConfig } from '../config/redis.config';
import { Mediator } from '../../shared/mediator';
import { TaskScheduledEvent } from '../../application/events/task-events';
import { UUID } from '../../shared';

export interface DelayedNotificationJob {
  taskId: UUID;
  userId: UUID;
  title: string;
  dueDate: string;
}

export class NotificationQueueService {
  private queue: Queue;
  private worker: Worker;

  constructor(
    private readonly redisUrl: string, 
    private readonly mediator: Mediator
  ) {
    const connection = { url: this.redisUrl };
    
    this.queue = new Queue('notification-queue', { connection });
    
    this.worker = new Worker('notification-queue', async (job: Job<DelayedNotificationJob>) => {
      console.log(`[QUEUE-WORKER] Processing delayed job ${job.id} for task: ${job.data.title}`);
      
      // When the time is up, we publish an event back to the Mediator.
      // This event will be caught by the NotificationController to push to SSE.
      await this.mediator.publish(new TaskScheduledEvent(
        job.data.taskId,
        job.data.userId,
        `[ALARM] ${job.data.title}`,
        job.data.dueDate
      ));
    }, { connection });

    this.worker.on('completed', job => {
      console.log(`[QUEUE-WORKER] Job ${job.id} completed!`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[QUEUE-WORKER] Job ${job?.id} failed:`, err);
    });
  }

  async scheduleNotification(data: DelayedNotificationJob, delayMs: number) {
    const jobId = `notif-${data.taskId}`;
    
    // Remove existing job for this task if it exists (e.g. if due date changed)
    const existingJob = await this.queue.getJob(jobId);
    if (existingJob) {
      await existingJob.remove();
      console.log(`[QUEUE] Removed existing job for task ${data.taskId}`);
    }

    if (delayMs <= 0) {
      console.log(`[QUEUE] Delay is 0 or negative for task ${data.taskId}. Publishing immediately.`);
      await this.mediator.publish(new TaskScheduledEvent(data.taskId, data.userId, data.title, data.dueDate));
      return;
    }

    console.log(`[QUEUE] Scheduling notification for task ${data.taskId} in ${delayMs / 1000}s`);
    await this.queue.add('send-notification', data, {
      delay: delayMs,
      jobId: jobId, // Deduplication
      removeOnComplete: true,
      removeOnFail: true
    });
  }

  async cancelNotification(taskId: UUID) {
    const jobId = `notif-${taskId}`;
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`[QUEUE] Cancelled pending notification for task ${taskId}`);
    }
  }
}
