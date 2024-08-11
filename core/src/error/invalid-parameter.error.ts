/**
 * Custom error class for handling invalid parameter errors.
 */
export class InvalidParameterError extends Error {
  /** The name of the error. */
  static readonly name = 'InvalidParameterError';

  /**
   * Creates an instance of InvalidParameterError.
   * @param {string} message - The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = InvalidParameterError.name;
  }
}
