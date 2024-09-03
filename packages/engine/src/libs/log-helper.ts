import { createLogger, format, transports } from 'winston';
import { Logger } from '@letrun/common';

class DefaultLogger implements Logger {
  private readonly winstonLogger = createLogger({
    level: 'debug',
    format: format.json(),
    transports: [
      new transports.Console({
        format: format.combine(format.colorize({ all: true }), format.simple()),
      }),
    ],
  });

  setLevel(level: string): void {
    this.winstonLogger.level = level;
  }

  disable() {
    this.winstonLogger.transports.forEach((t) => (t.silent = true));
  }

  debug(message: string, ...args: any[]): void {
    this.winstonLogger.debug(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.winstonLogger.error(message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.winstonLogger.info(message, ...args);
  }

  verbose(message: string, ...args: any[]): void {
    this.winstonLogger.verbose(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.winstonLogger.warn(message, ...args);
  }
}

export const DEFAULT_LOGGER = new DefaultLogger();
