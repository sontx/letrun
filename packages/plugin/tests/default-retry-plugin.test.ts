import DefaultRetryPlugin from '@src/default-retry-plugin';
import { InterruptInvokeError } from '@letrun/core';

const jest = import.meta.jest;

describe('DefaultRetryPlugin', () => {
  let retryPlugin: DefaultRetryPlugin;

  beforeEach(() => {
    retryPlugin = new DefaultRetryPlugin();
  });

  it('retries the job until it succeeds', async () => {
    const doJob = jest.fn().mockRejectedValueOnce(new Error('Job failed')).mockResolvedValueOnce('Job succeeded');
    const shouldRetryFn = jest.fn().mockReturnValue(true);
    const retryable = { retries: 0 };
    const config = { retryCount: 3, retryDelaySeconds: 1, retryStrategy: 'fixed' };
    const signal = new AbortController().signal;

    const result = await retryPlugin.retry({ doJob, shouldRetryFn, retryable, config, signal });

    expect(result).toBe('Job succeeded');
    expect(doJob).toHaveBeenCalledTimes(2);
    expect(retryable.retries).toBe(1);
  });

  it('throws error if max retry attempts are reached', async () => {
    const doJob = jest.fn().mockRejectedValue(new Error('Job failed'));
    const shouldRetryFn = jest.fn().mockReturnValue(true);
    const retryable = { retries: 0 };
    const config = { retryCount: 3, retryDelaySeconds: 1, retryStrategy: 'fixed' };
    const signal = new AbortController().signal;

    await expect(retryPlugin.retry({ doJob, shouldRetryFn, retryable, config, signal })).rejects.toThrow('Job failed');
    expect(doJob).toHaveBeenCalledTimes(3);
    expect(retryable.retries).toBe(3);
  });

  it('throws error if shouldRetryFn returns false', async () => {
    const doJob = jest.fn().mockRejectedValue(new Error('Job failed'));
    const shouldRetryFn = jest.fn().mockReturnValue(false);
    const retryable = { retries: 0 };
    const config = { retryCount: 3, retryDelaySeconds: 1, retryStrategy: 'fixed' };
    const signal = new AbortController().signal;

    await expect(retryPlugin.retry({ doJob, shouldRetryFn, retryable, config, signal })).rejects.toThrow('Job failed');
    expect(doJob).toHaveBeenCalledTimes(1);
    expect(retryable.retries).toBe(1);
  });

  it('throws InterruptInvokeError if signal is aborted', async () => {
    const doJob = jest.fn().mockRejectedValue(new Error('Job failed'));
    const shouldRetryFn = jest.fn().mockReturnValue(true);
    const retryable = { retries: 0 };
    const config = { retryCount: 3, retryDelaySeconds: 1, retryStrategy: 'fixed' };
    const abortController = new AbortController();
    const signal = abortController.signal;

    setTimeout(() => abortController.abort(), 500);

    await expect(retryPlugin.retry({ doJob, shouldRetryFn, retryable, config, signal })).rejects.toThrow(
      InterruptInvokeError,
    );
    expect(doJob).toHaveBeenCalledTimes(1);
  });

  it('throws InterruptInvokeError if signal is aborted before retry method is called', async () => {
    const doJob = jest.fn().mockRejectedValue(new Error('Job failed'));
    const shouldRetryFn = jest.fn().mockReturnValue(true);
    const retryable = { retries: 0 };
    const config = { retryCount: 3, retryDelaySeconds: 1, retryStrategy: 'fixed' };
    const abortController = new AbortController();
    const signal = abortController.signal;

    abortController.abort(); // Abort the signal before calling retry

    await expect(retryPlugin.retry({ doJob, shouldRetryFn, retryable, config, signal })).rejects.toThrow(
      InterruptInvokeError,
    );
    expect(doJob).not.toHaveBeenCalled();
  });

  it('calculates correct delay for fixed strategy', async () => {
    const doJob = jest
      .fn()
      .mockRejectedValueOnce(new Error('Job failed'))
      .mockRejectedValueOnce(new Error('Job failed again'))
      .mockResolvedValueOnce('Job succeeded');
    const shouldRetryFn = jest.fn().mockReturnValue(true);
    const retryable = { retries: 0 };
    const config = { retryCount: 3, retryDelaySeconds: 1, retryStrategy: 'fixed' };
    const signal = new AbortController().signal;

    const result = await retryPlugin.retry({ doJob, shouldRetryFn, retryable, config, signal });

    expect(result).toBe('Job succeeded');
    expect(doJob).toHaveBeenCalledTimes(3);
    expect(retryable.retries).toBe(2);

    const delayMilliseconds = retryPlugin['getRetryDelay'](0, config);
    expect(delayMilliseconds).toBe(1000); // 1 * 1000

    const delayMilliseconds2 = retryPlugin['getRetryDelay'](1, config);
    expect(delayMilliseconds2).toBe(1000); // 1 * 1000
  });

  it('calculates correct delay for exponential_backoff strategy', async () => {
    const doJob = jest
      .fn()
      .mockRejectedValueOnce(new Error('Job failed'))
      .mockRejectedValueOnce(new Error('Job failed again'))
      .mockResolvedValueOnce('Job succeeded');
    const shouldRetryFn = jest.fn().mockReturnValue(true);
    const retryable = { retries: 0 };
    const config = { retryCount: 3, retryDelaySeconds: 1, retryStrategy: 'exponential_backoff' };
    const signal = new AbortController().signal;

    const result = await retryPlugin.retry({ doJob, shouldRetryFn, retryable, config, signal });

    expect(result).toBe('Job succeeded');
    expect(doJob).toHaveBeenCalledTimes(3);
    expect(retryable.retries).toBe(2);

    const delayMilliseconds = retryPlugin['getRetryDelay'](0, config);
    expect(delayMilliseconds).toBe(1000); // 1 * 2^0 * 1000

    const delayMilliseconds2 = retryPlugin['getRetryDelay'](1, config);
    expect(delayMilliseconds2).toBe(2000); // 1 * 2^1 * 1000
  }, 8000);

  it('calculates correct delay for linear_backoff strategy', async () => {
    const doJob = jest
      .fn()
      .mockRejectedValueOnce(new Error('Job failed'))
      .mockRejectedValueOnce(new Error('Job failed again'))
      .mockResolvedValueOnce('Job succeeded');
    const shouldRetryFn = jest.fn().mockReturnValue(true);
    const retryable = { retries: 0 };
    const config = { retryCount: 3, retryDelaySeconds: 1, retryStrategy: 'linear_backoff' };
    const signal = new AbortController().signal;

    const result = await retryPlugin.retry({ doJob, shouldRetryFn, retryable, config, signal });

    expect(result).toBe('Job succeeded');
    expect(doJob).toHaveBeenCalledTimes(3);
    expect(retryable.retries).toBe(2);

    const delayMilliseconds = retryPlugin['getRetryDelay'](0, config);
    expect(delayMilliseconds).toBe(0); // 1 * 1.5 * 0 * 1000

    const delayMilliseconds2 = retryPlugin['getRetryDelay'](1, config);
    expect(delayMilliseconds2).toBe(1500); // 1 * 1.5 * 1 * 1000
  }, 6000);
});
