import { LOGGER_PLUGIN, LoggerPlugin } from '@letrun/core';
import { AppContext } from "@letrun/common";

export class LogHelper {
  /**
   * Ignores all log messages and write the error log level to stderr.
   * Forwards the output of fn to stdout.
   */
  static async usePipeMode(context: AppContext, fn: () => Promise<any>) {
    const loggerPlugin = await context.getPluginManager().getOne<LoggerPlugin>(LOGGER_PLUGIN);
    let hasError = false;
    loggerPlugin.hook('pre', (level, message) => {
      if (level === 'error') {
        hasError = true;
        process.stderr.write(message);
      }
      return true;
    });

    const result = await fn();
    if (!hasError && result !== undefined && result !== null) {
      const stResult = typeof result !== 'string' ? JSON.stringify(result, null, 2) : result;
      process.stdout.write(stResult);
    }
  }
}
