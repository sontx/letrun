import type * as Transport from 'winston-transport';
import { Plugin } from '../model';

export const LOGGER_PLUGIN = 'logger';

/**
 * Interface representing a Logger plugin.
 */
export interface LoggerPlugin extends Plugin {
  /**
   * Retrieves the transport mechanism for the logger.
   * @returns {Transport} The transport mechanism used by the logger.
   */
  getTransport(): Transport;
}
