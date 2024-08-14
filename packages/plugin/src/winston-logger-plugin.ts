import { AbstractPlugin, AppContext, LOG_TRANSPORT_PLUGIN, Logger, LOGGER_PLUGIN, LoggerPlugin } from '@letrun/core';
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

export default class WinstonLoggerPlugin extends AbstractPlugin implements LoggerPlugin {
  name = 'winston-logger';
  type = LOGGER_PLUGIN;

  private winstonLogger = createLogger({
    level: 'debug',
    format: format.json(),
  });
  private readonly logger: Logger;

  /**
   * Creates an instance of LoggerModule.
   */
  constructor() {
    super();
    this.logger = new DefaultLogger(this.winstonLogger);
  }

  protected async doLoad(context: AppContext): Promise<void> {
    await super.doLoad(context);
    this.winstonLogger.level = await context.getConfigProvider().get('logger.level', 'debug');
  }

  protected async onConfigChange(newConfig: Record<string, any>): Promise<void> {
    await super.onConfigChange(newConfig);
    if ('logger.level' in newConfig) {
      this.winstonLogger.level = newConfig['logger.level'];
    }
  }

  async ready(context: AppContext) {
    const pluginManager = context.getPluginManager();
    const loggerPlugins = await pluginManager.get<LoggerPlugin>(LOG_TRANSPORT_PLUGIN);
    for (const plugin of loggerPlugins) {
      const transport = plugin.getTransport();
      this.winstonLogger.add(transport);
    }
  }

  getLogger(): Logger {
    return this.logger;
  }

  protected async doUnload(): Promise<void> {
    await super.doUnload();
    this.winstonLogger.close();
  }
}
