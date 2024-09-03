/**
 * Error thrown when an interrupt is invoked while invoking a chain of plugins or tasks.
 */
export class InterruptInvokeError extends Error {
  /** The name of the error. */
  static readonly name = 'InterruptInvokeError';

  /** The result associated with the error, if any. */
  readonly result?: any;

  /**
   * Creates an instance of InterruptInvokeError.
   * @param {string} message - The error message.
   * @param {any} [result] - The result associated with the error.
   */
  constructor(message: string, result?: any) {
    super(message);
    this.name = InterruptInvokeError.name;
    this.result = result;
  }
}
