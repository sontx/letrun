/**
 * Custom error class for handling illegal state errors.
 */
export class IllegalStateError extends Error {
  /** The name of the error. */
  static readonly name = 'IllegalStateError';

  /**
   * Creates an instance of IllegalStateError.
   * @param {string} message - The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = IllegalStateError.name;
  }
}
