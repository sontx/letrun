/**
 * Custom error class for handling configuration not found errors.
 */
export class ConfigNotFoundError extends Error {
  /** The name of the error. */
  static readonly name = 'ConfigNotFoundError';

  /**
   * Creates an instance of ConfigNotFoundError.
   * @param {string} message - The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = ConfigNotFoundError.name;
  }
}
