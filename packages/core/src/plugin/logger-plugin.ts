import { Plugin, Logger } from '@letrun/common';

export const LOGGER_PLUGIN = 'logger';

export type PostHookFn = (level: string, message: string, ...args: any[]) => void;
export type PreHookFn = (level: string, message: string, ...args: any[]) => boolean;

/**
 * Interface representing a Logger plugin.
 */
export interface LoggerPlugin extends Plugin {
  readonly type: typeof LOGGER_PLUGIN;

  getLogger(): Logger;

  /**
   * Hooks into the logger, these {@link hookFn} will be called after a log message has been written.
   */
  hook(action: 'post', hookFn: PostHookFn): void;

  /**
   * Hooks into the logger, these {@link hookFn} will be called before a log message is written.
   * If any of the {@link hookFn} returns `true`, the log message will be skipped.
   */
  hook(action: 'pre', hookFn: PreHookFn): void;
}
