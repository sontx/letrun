import {
  AbstractPlugin,
  AppContext,
  BUILTIN_PLUGIN_PRIORITY,
  LOG_TRANSPORT_PLUGIN,
  Logger,
  LOGGER_PLUGIN,
  LoggerPlugin,
} from '@letrun/core';
import winston, { createLogger, format } from 'winston';

class DefaultLogger implements Logger {
  disabled = false;

  constructor(private logger: winston.Logger) {}

  verbose(message: string, ...args: any[]): void {
    if (!this.disabled) {
      this.logger.verbose(message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (!this.disabled) {
      this.logger.debug(message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (!this.disabled) {
      this.logger.error(message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (!this.disabled) {
      this.logger.info(message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!this.disabled) {
      this.logger.warn(message, ...args);
    }
  }
}

export default class WinstonLoggerPlugin extends AbstractPlugin implements LoggerPlugin {
  name = 'winston-logger';
  type = LOGGER_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

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
    // prevent logging after unloading
    if (this.logger instanceof DefaultLogger) {
      this.logger.disabled = true;
    }
    this.winstonLogger.close();
  }
}
