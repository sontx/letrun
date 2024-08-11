import fs from 'fs';
import { AbstractConfigProvider } from './abstract-config-provider';
import { DEFAULT_LOGGER } from '../logger';

/**
 * Class representing a configuration provider that loads configuration from a JSON file.
 * Extends the AbstractConfigProvider class.
 */
export class JsonConfigProvider extends AbstractConfigProvider {
  /**
   * Creates an instance of JsonConfigProvider.
   * @param {string} filePath - The path to the JSON configuration file.
   */
  constructor(private filePath: string) {
    super();
  }

  /**
   * Loads the configuration data from the JSON file.
   * @returns {Promise<Record<string, any>>} A promise that resolves with the configuration data.
   */
  async load(): Promise<Record<string, any>> {
    if (!fs.existsSync(this.filePath)) {
      DEFAULT_LOGGER.debug(`File not found, skip this config file: ${this.filePath}`);
      return {};
    }

    const fileContent = await fs.promises.readFile(this.filePath, 'utf8');
    const val = JSON.parse(fileContent) as Record<string, any>;
    DEFAULT_LOGGER.debug(`Loaded JSON config from ${this.filePath} with ${Object.keys(val).length} key(s)`);
    return val;
  }
}
