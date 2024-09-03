import {
  AbstractPlugin,
  delayMs,
  RETRY_PLUGIN,
  RetryInput,
  RetryPlugin,
} from '@letrun/core';
import { AppContext, InterruptInvokeError, RetryConfig } from "@letrun/common";

const DEFAULT_RETRY_DELAY_SECONDS = 3;
const DEFAULT_RETRY_COUNT = 3;

export default class DefaultRetryPlugin extends AbstractPlugin implements RetryPlugin {
  readonly type = RETRY_PLUGIN;
  readonly name = 'default';

  private backoffRate = 1.5;

  protected async doLoad(context: AppContext): Promise<void> {
    await super.doLoad(context);
    await this.injectConfig();
  }

  async retry<T = any>({ doJob, shouldRetryFn, retryable, config, signal }: RetryInput<T>): Promise<T> {
    if (signal?.aborted) {
      throw new InterruptInvokeError('Aborted');
    }

    let attemptNumber = 0;
    const maxAttempts = Math.max(config.retryCount ?? DEFAULT_RETRY_COUNT, 0);

    while (attemptNumber < maxAttempts) {
      try {
        return await doJob();
      } catch (error) {
        attemptNumber++;
        retryable.retries = attemptNumber;

        if (attemptNumber >= maxAttempts) {
          throw error; // Rethrow the error if max attempts reached
        }

        if (shouldRetryFn && !shouldRetryFn(error as Error)) {
          throw error; // Rethrow the error if the caller doesn't want to retry on this error
        }

        const delayMilliseconds = this.getRetryDelay(attemptNumber, config);
        await delayMs(delayMilliseconds, signal);

        if (signal?.aborted) {
          throw new InterruptInvokeError('Aborted');
        }
      }
    }

    return doJob();
  }

  private getRetryDelay(
    attemptNumber: number,
    { retryDelaySeconds = DEFAULT_RETRY_DELAY_SECONDS, retryStrategy }: RetryConfig,
  ): number {
    switch (retryStrategy ?? 'fixed') {
      case 'fixed':
        return retryDelaySeconds * 1000;
      case 'exponential_backoff':
        return retryDelaySeconds * Math.pow(2, attemptNumber) * 1000;
      case 'linear_backoff':
        return retryDelaySeconds * this.backoffRate * attemptNumber * 1000;
      default:
        throw new Error(`Unsupported retry strategy: ${retryStrategy}`);
    }
  }
}
