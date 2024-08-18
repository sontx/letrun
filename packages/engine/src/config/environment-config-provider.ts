import {AbstractConfigProvider} from './abstract-config-provider';
import { DEFAULT_LOGGER } from '@src/libs/log-helper';

/**
 * Class representing a configuration provider that loads environment variables.
 * Extends the AbstractConfigProvider class.
 */
export class EnvironmentConfigProvider extends AbstractConfigProvider {
  /**
   * Loads the environment variables.
   * @returns {Promise<Record<string, any>>} A promise that resolves with the environment variables.
   */
  async load(): Promise<Record<string, any>> {
    const val = JSON.parse(JSON.stringify(process.env));
    DEFAULT_LOGGER.debug(`Loaded environment variables with ${Object.keys(val).length} key(s)`);
    return val;
  }
}
