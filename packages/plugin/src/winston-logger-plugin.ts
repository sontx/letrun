import {
  AbstractPlugin,
  AppContext,
  BUILTIN_PLUGIN_PRIORITY,
  LOG_TRANSPORT_PLUGIN,
  Logger,
  LOGGER_PLUGIN,
  LoggerPlugin,
  PostHookFn,
  PreHookFn,
} from '@letrun/core';
import winston, { createLogger, format } from 'winston';

class DefaultLogger implements Logger, Pick<LoggerPlugin, 'hook'> {
  private readonly postHooks: PostHookFn[] = [];
  private readonly preHooks: PreHookFn[] = [];
  private disabled = false;

  constructor(private logger: winston.Logger) {}

  disable() {
    this.disabled = true;
  }

  hook(action: 'post' | 'pre', hookFn: PreHookFn | PostHookFn): void {
    if (action === 'post') {
      this.postHooks.push(hookFn as PostHookFn);
    } else {
      this.preHooks.push(hookFn as PreHookFn);
    }
  }

  private runPreHooks(level: string, message: string, ...args: any[]) {
    let cancel = false;
    for (const hook of this.preHooks) {
      if (hook(level, message, ...args)) {
        cancel = true;
      }
    }
    return cancel;
  }

  private runPostHooks(level: string, message: string, ...args: any[]) {
    for (const hook of this.postHooks) {
      hook(level, message, ...args);
    }
  }

  verbose(message: string, ...args: any[]): void {
    if (!this.disabled) {
      if (!this.runPreHooks('verbose', message, ...args)) {
        this.logger.verbose(message, ...args);
        this.runPostHooks('verbose', message, ...args);
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    if (!this.disabled) {
      if (!this.runPreHooks('debug', message, ...args)) {
        this.logger.debug(message, ...args);
        this.runPostHooks('debug', message, ...args);
      }
    }
  }

  error(message: string, ...args: any[]): void {
    if (!this.disabled) {
      if (!this.runPreHooks('error', message, ...args)) {
        this.logger.error(message, ...args);
        this.runPostHooks('error', message, ...args);
      }
    }
  }

  info(message: string, ...args: any[]): void {
    if (!this.disabled) {
      if (!this.runPreHooks('info', message, ...args)) {
        this.logger.info(message, ...args);
        this.runPostHooks('info', message, ...args);
      }
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!this.disabled) {
      if (!this.runPreHooks('warn', message, ...args)) {
        this.logger.warn(message, ...args);
        this.runPostHooks('warn', message, ...args);
      }
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
  private readonly logger = new DefaultLogger(this.winstonLogger);

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

  hook(action: 'post' | 'pre', hookFn: PreHookFn | PostHookFn): void {
    this.logger.hook(action, hookFn);
  }

  protected async doUnload(): Promise<void> {
    await super.doUnload();
    // prevent logging after unloading
    this.logger.disable();
    this.winstonLogger.close();
  }
}
