import type * as Transport from 'winston-transport';
import { Plugin } from '@letrun/common';

export const LOG_TRANSPORT_PLUGIN = 'log-transport';

/**
 * Interface representing a Winston log transport plugin.
 */
export interface LogTransportPlugin extends Plugin {
  readonly type: typeof LOG_TRANSPORT_PLUGIN;

  getTransport(): Transport;
}
