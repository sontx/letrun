import { AppContext, LOG_TRANSPORT_PLUGIN, Logger, LOGGER_PLUGIN, LoggerPlugin } from '@letrun/core';
import winston, { createLogger, format } from 'winston';

class DefaultLogger implements Logger {
  constructor(private logger: winston.Logger) {}

  verbose(message: string, ...args: any[]): void {
    this.logger.verbose(message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.logger.error(message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.logger.info(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }
}

export default class WinstonLoggerPlugin implements LoggerPlugin {
  name = 'winston-logger';
  type = LOGGER_PLUGIN;

  private winstonLogger = createLogger({
    level: 'debug',
    format: format.json(),
  });
  private loaded = false;
  private readonly logger: Logger;

  /**
   * Creates an instance of LoggerModule.
   */
  constructor() {
    this.logger = new DefaultLogger(this.winstonLogger);
  }

  async load(context: AppContext): Promise<void> {
    if (this.loaded) {
      return;
    }

    this.winstonLogger.level = await context.getConfigProvider().get('logger.level', 'debug');
    this.loaded = true;
  }

  async ready(context: AppContext) {
    const pluginManager = context.getPluginManager();
    const loggerPlugins = await pluginManager.get<LoggerPlugin>(LOG_TRANSPORT_PLUGIN);
    for (const plugin of loggerPlugins) {
      const transport = plugin.getTransport();
      this.winstonLogger.add(transport);
    }
  }

  async unload(): Promise<void> {
    this.winstonLogger.close();
  }

  getLogger(): Logger {
    return this.logger;
  }
}
