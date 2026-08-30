export interface ToolContext {
  userId?: string;
  correlationId: string;
}

export interface ToolResult<T = unknown> {
  data: T;
  source: string;
}

export interface Tool<TInput = unknown, TOutput = unknown> {
  readonly name: string;
  readonly description: string;
  execute(input: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;
}

export class ToolExecutionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}
