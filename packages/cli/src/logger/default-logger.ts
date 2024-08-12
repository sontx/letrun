import { Logger } from '@letrun/core';
import winston from 'winston';

/**
 * Class representing the default logger implementation.
 * Implements the Logger interface.
 */
export class DefaultLogger implements Logger {
  /**
   * Creates an instance of DefaultLogger.
   * @param {winston.Logger} logger - The winston logger instance.
   */
  constructor(private logger: winston.Logger) {}

  /**
   * Logs a verbose message.
   * @param {string} message - The message to log.
   * @param {...any[]} args - Additional arguments to log.
   */
  verbose(message: string, ...args: any[]): void {
    this.logger.verbose(message, ...args);
  }

  /**
   * Logs a debug message.
   * @param {string} message - The message to log.
   * @param {...any[]} args - Additional arguments to log.
   */
  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }

  /**
   * Logs an error message.
   * @param {string} message - The message to log.
   * @param {...any[]} args - Additional arguments to log.
   */
  error(message: string, ...args: any[]): void {
    this.logger.error(message, ...args);
  }

  /**
   * Logs an informational message.
   * @param {string} message - The message to log.
   * @param {...any[]} args - Additional arguments to log.
   */
  info(message: string, ...args: any[]): void {
    this.logger.info(message, ...args);
  }

  /**
   * Logs a warning message.
   * @param {string} message - The message to log.
   * @param {...any[]} args - Additional arguments to log.
   */
  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }
}
