export interface IRequest<TResponse> {}

export interface IRequestHandler<TRequest extends IRequest<TResponse>, TResponse> {
  handle(request: TRequest): Promise<TResponse>;
}

export type Newable<T> = new (...args: any[]) => T;

export interface INotification {}

export interface INotificationHandler<TNotification extends INotification> {
  handle(notification: TNotification): Promise<void> | void;
}

export class Mediator {
  private handlers = new Map<any, IRequestHandler<any, any>>();
  private notificationHandlers = new Map<any, Array<(notification: any) => void>>();

  register<TRequest extends IRequest<TResponse>, TResponse>(
    requestType: Newable<TRequest>,
    handler: IRequestHandler<TRequest, TResponse>
  ): void {
    this.handlers.set(requestType, handler);
  }

  subscribe<TNotification extends INotification>(
    notificationType: Newable<TNotification>,
    callback: (notification: TNotification) => void
  ): void {
    if (!this.notificationHandlers.has(notificationType)) {
      this.notificationHandlers.set(notificationType, []);
    }
    this.notificationHandlers.get(notificationType)?.push(callback);
  }

  async publish<TNotification extends INotification>(notification: TNotification): Promise<void> {
    const handlers = this.notificationHandlers.get(notification.constructor);
    if (handlers) {
      handlers.forEach((handler) => handler(notification));
    }
  }

  async send<TResponse>(request: IRequest<TResponse>): Promise<TResponse> {
    const handler = this.handlers.get(request.constructor);
    if (!handler) {
      throw new Error(`No handler registered for request: ${request.constructor.name}`);
    }
    return handler.handle(request);
  }

  // Providing query as an alias for send for better semantics
  async query<TResponse>(request: IRequest<TResponse>): Promise<TResponse> {
    return this.send(request);
  }
}
