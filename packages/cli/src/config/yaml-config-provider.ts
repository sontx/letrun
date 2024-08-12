import fs from 'fs';
import { parse } from 'yaml';
import { AbstractConfigProvider } from './abstract-config-provider';
import { DEFAULT_LOGGER } from '../logger';

/**
 * Class representing a configuration provider that loads configuration from a YAML file.
 * Extends the AbstractConfigProvider class.
 */
export class YamlConfigProvider extends AbstractConfigProvider {
  /**
   * Creates an instance of YamlConfigProvider.
   * @param {string} filePath - The path to the YAML configuration file.
   */
  constructor(private filePath: string) {
    super();
  }

  /**
   * Loads the configuration data from the YAML file.
   * @returns {Promise<Record<string, any>>} A promise that resolves with the configuration data.
   */
  async load(): Promise<Record<string, any>> {
    if (!fs.existsSync(this.filePath)) {
      DEFAULT_LOGGER.debug(`File not found, skip this config file: ${this.filePath}`);
      return {};
    }
    const fileContent = await fs.promises.readFile(this.filePath, 'utf8');
    const val = parse(fileContent) as Record<string, any>;
    DEFAULT_LOGGER.debug(`Loaded YAML config from ${this.filePath} with ${Object.keys(val).length} key(s)`);
    return val;
  }
}
