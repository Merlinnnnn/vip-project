export interface IRequest<TResponse> {}

export interface IRequestHandler<TRequest extends IRequest<TResponse>, TResponse> {
  handle(request: TRequest): Promise<TResponse>;
}

export type Newable<T> = new (...args: any[]) => T;

export class Mediator {
  private handlers = new Map<any, IRequestHandler<any, any>>();

  register<TRequest extends IRequest<TResponse>, TResponse>(
    requestType: Newable<TRequest>,
    handler: IRequestHandler<TRequest, TResponse>
  ): void {
    this.handlers.set(requestType, handler);
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
