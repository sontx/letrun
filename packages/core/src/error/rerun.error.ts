/**
 * Error thrown when a task should be rerun.
 */
export class RerunError extends Error {
  /** The name of the error. */
  static readonly name = 'RerunError';

  /**
   * Creates an instance of RerunError.
   */
  constructor() {
    super();
    this.name = RerunError.name;
  }
}
