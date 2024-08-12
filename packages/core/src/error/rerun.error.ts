/**
 * Error thrown when a task should be rerun.
 */
export class RerunError extends Error {
  /** The name of the error. */
  static readonly name = 'RerunError';

  /**
   * Creates an instance of RerunError.
   */
  constructor(message?: string) {
    super(message);
    this.name = RerunError.name;
  }
}
