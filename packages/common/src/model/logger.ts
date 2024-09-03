/**
 * Interface representing a logger.
 */
export interface Logger {
  /**
   * Logs a verbose message.
   * @param message - The message to log.
   * @param args - Additional arguments for the message.
   */
  verbose(message: string, ...args: any[]): void;

  /**
   * Logs a debug message.
   * @param message - The message to log.
   * @param args - Additional arguments for the message.
   */
  debug(message: string, ...args: any[]): void;

  /**
   * Logs an informational message.
   * @param message - The message to log.
   * @param args - Additional arguments for the message.
   */
  info(message: string, ...args: any[]): void;

  /**
   * Logs a warning message.
   * @param message - The message to log.
   * @param args - Additional arguments for the message.
   */
  warn(message: string, ...args: any[]): void;

  /**
   * Logs an error message.
   * @param message - The message to log.
   * @param args - Additional arguments for the message.
   */
  error(message: string, ...args: any[]): void;
}
