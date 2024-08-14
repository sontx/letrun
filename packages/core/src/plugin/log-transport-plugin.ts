import type * as Transport from 'winston-transport';
import { Plugin } from '@src/model';

export const LOG_TRANSPORT_PLUGIN = 'log-transport';

/**
 * Interface representing a Winston log transport plugin.
 */
export interface LogTransportPlugin extends Plugin {
  getTransport(): Transport;
}
