import { AppContext, Logger, LOGGER_PLUGIN, LoggerPlugin, Module } from '@letrun/core';
import { createLogger, format, transports } from 'winston';
import { DefaultLogger } from './default-logger';

/**
 * The default logger instance using winston.
 * @constant
 */
export const DEFAULT_LOGGER = createLogger({
  level: 'debug',
  format: format.json(),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize({ all: true }), format.simple()),
    }),
  ],
});

/**
 * Class representing a logger module.
 * Implements the Module interface.
 */
export class LoggerModule implements Module {
  /**
   * The winston logger instance.
   * @private
   */
  private winstonLogger = createLogger({
    level: 'debug',
    format: format.json(),
  });

  /**
   * The logger instance.
   * @private
   * @type {Logger}
   */
  private readonly logger: Logger;

  /**
   * Creates an instance of LoggerModule.
   */
  constructor() {
    this.logger = new DefaultLogger(this.winstonLogger);
  }

  /**
   * Loads the logger module.
   * @param {AppContext} context - The application context.
   * @returns {Promise<void>} A promise that resolves when the module is loaded.
   */
  async load(context: AppContext): Promise<void> {
    const pluginManager = context.getPluginManager();
    const loggerPlugins = await pluginManager.get<LoggerPlugin>(LOGGER_PLUGIN);
    for (const plugin of loggerPlugins) {
      const transport = plugin.getTransport();
      this.winstonLogger.add(transport);
    }

    this.winstonLogger.level = await context.getConfigProvider().get('logger.level', 'debug');
  }

  /**
   * Unloads the logger module.
   * @returns {Promise<void>} A promise that resolves when the module is unloaded.
   */
  async unload(): Promise<void> {
    this.winstonLogger.close();
  }

  /**
   * Retrieves the logger instance.
   * @returns {Logger} The logger instance.
   */
  getLogger(): Logger {
    return this.logger;
  }
}
