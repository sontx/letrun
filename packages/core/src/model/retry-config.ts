export interface RetryConfig {
  /**
   * Number of retries to attempt when a Task is marked as failure.
   *
   * Defaults to 3 with maximum allowed capped at 10.
   */
  retryCount?: number;

  /**
   * Mechanism for the retries.
   *
   * Defaults to 'fixed'.
   */
  retryStrategy?: RetryStrategy;

  /**
   * Time to wait before retries in seconds.
   *
   * Defaults to 3 seconds.
   */
  retryDelaySeconds?: number;
}

export type RetryStrategy = 'fixed' | 'exponential_backoff' | 'linear_backoff' | string;
