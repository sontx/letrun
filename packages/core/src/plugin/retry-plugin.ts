import { Plugin, Retryable, RetryConfig } from '../model';

export const RETRY_PLUGIN = 'retry';

export interface RetryInput<T> {
  retryable: Retryable;
  config: RetryConfig;
  shouldRetryFn?: (err: Error) => boolean;
  doJob: () => Promise<T>;
  signal?: AbortSignal;
}

export interface RetryPlugin extends Plugin {
  readonly type: typeof RETRY_PLUGIN;

  retry<T = any>(input: RetryInput<T>): Promise<T>;
}
