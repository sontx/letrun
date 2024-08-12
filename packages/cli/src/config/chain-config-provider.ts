import { EnvironmentConfigProvider } from './environment-config-provider';
import { JsonConfigProvider } from './json-config-provider';
import path from 'node:path';
import { YamlConfigProvider } from './yaml-config-provider';
import { ConfigNotFoundError, ConfigProvider, FunctionKeys, getEntryPointDir, ObjectType } from '@letrun/core';
import fs from 'fs';

/**
 * Class representing a chain of configuration providers.
 * Implements the ConfigProvider interface.
 */
export class ChainConfigProvider implements ConfigProvider {
  /**
   * The chain of configuration providers.
   * @private
   */
  private readonly configProviderChain: ConfigProvider[] = [];

  /**
   * The cached configuration data.
   * @private
   */
  private config?: Record<string, any>;

  /**
   * Creates an instance of ChainConfigProvider.
   * @param {string} [configDir=''] - The directory where configuration files are located.
   * @param {string} [fileName='config'] - The base name of the configuration files.
   */
  constructor(configDir: string = '', fileName: string = 'letrun') {
    const fullDir = path.resolve(getEntryPointDir(), configDir);

    const jsonFile = path.resolve(fullDir, fileName + '.json');
    if (fs.existsSync(jsonFile)) {
      this.configProviderChain.push(new JsonConfigProvider(jsonFile));
    }

    const yamlFile = path.resolve(fullDir, fileName + '.yaml');
    if (fs.existsSync(yamlFile)) {
      this.configProviderChain.push(new YamlConfigProvider(yamlFile));
    }

    const ymlFile = path.resolve(fullDir, fileName + '.yml');
    if (fs.existsSync(ymlFile)) {
      this.configProviderChain.push(new YamlConfigProvider(ymlFile));
    }

    this.configProviderChain.push(new EnvironmentConfigProvider());
  }

  /**
   * Sets a configuration value to the in-memory store.
   */
  async set(key: string, value: any): Promise<void> {
    const config = await this.getAll();
    config[key] = value;

    for (const configProvider of this.configProviderChain) {
      await configProvider.set(key, value);
    }
  }

  /**
   * Retrieves all configuration data.
   * @returns {Promise<ObjectType>} A promise that resolves with the configuration data.
   */
  async getAll(): Promise<ObjectType> {
    if (!this.config) {
      const result: ObjectType = {};
      for (const configProvider of this.configProviderChain.reverse()) {
        const val = await configProvider.getAll();
        Object.assign(val);
      }
      this.config = result;
    }
    return this.config;
  }

  /**
   * Retrieves a string value for a given key.
   * @param {string} key - The configuration key.
   * @param {string} [defaultValue] - The default value if the key is not found.
   * @returns {Promise<string>} A promise that resolves with the string value.
   * @throws {ConfigNotFoundError} If the key is not found and no default value is provided.
   */
  get(key: string, defaultValue?: string): Promise<string> {
    return this.doGet(key, 'get', defaultValue);
  }

  /**
   * Retrieves a boolean value for a given key.
   * @param {string} key - The configuration key.
   * @param {boolean} [defaultValue] - The default value if the key is not found.
   * @returns {Promise<boolean>} A promise that resolves with the boolean value.
   */
  getBoolean(key: string, defaultValue?: boolean): Promise<boolean> {
    return this.doGet(key, 'getBoolean', defaultValue);
  }

  /**
   * Retrieves a float value for a given key.
   * @param {string} key - The configuration key.
   * @param {number} [defaultValue] - The default value if the key is not found.
   * @returns {Promise<number>} A promise that resolves with the float value.
   */
  getFloat(key: string, defaultValue?: number): Promise<number> {
    return this.doGet(key, 'getFloat', defaultValue);
  }

  /**
   * Retrieves an integer value for a given key.
   * @param {string} key - The configuration key.
   * @param {number} [defaultValue] - The default value if the key is not found.
   * @returns {Promise<number>} A promise that resolves with the integer value.
   */
  getInt(key: string, defaultValue?: number): Promise<number> {
    return this.doGet(key, 'getInt', defaultValue);
  }

  /**
   * Helper method to retrieve a value for a given key using a specified method.
   * @private
   * @template T
   * @param {string} key - The configuration key.
   * @param {FunctionKeys<ConfigProvider>} method - The method to use for retrieval.
   * @param {T} [defaultValue] - The default value if the key is not found.
   * @returns {Promise<T>} A promise that resolves with the value.
   * @throws {ConfigNotFoundError} If the key is not found and no default value is provided.
   */
  private async doGet<T>(key: string, method: FunctionKeys<ConfigProvider>, defaultValue?: T): Promise<T> {
    for (const configProvider of this.configProviderChain) {
      try {
        const fn = configProvider[method] as Function;
        return await fn.call(configProvider, key);
      } catch (e: any) {
        if (e.name === ConfigNotFoundError.name) {
          // skip
        } else {
          throw e;
        }
      }
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new ConfigNotFoundError(`Config not found for key: ${key}`);
  }

  /**
   * Unloads the configuration data.
   * @returns {Promise<void>} A promise that resolves when the configuration data is unloaded.
   */
  unload(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
