import { Plugin } from '@src/model';
import { Logger } from '@src/model/logger';

export const LOGGER_PLUGIN = 'logger';

/**
 * Interface representing a Logger plugin.
 */
export interface LoggerPlugin extends Plugin {
  getLogger(): Logger;
}
