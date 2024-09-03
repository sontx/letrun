import { ConfigNotFoundError, ConfigProvider, ObjectType } from '@letrun/common';
import { JSONPath } from 'jsonpath-plus';
import { Observable, Subject } from 'rxjs';

const EMPTY: any = {};

/**
 * Abstract class representing a configuration provider.
 * Implements the ConfigProvider interface.
 */
export abstract class AbstractConfigProvider implements ConfigProvider {
  /**
   * The configuration data.
   * @protected
   */
  protected config?: Record<string, any>;

  /**
   * A map to store matched results for configuration keys.
   * @private
   */
  private matchedResult = new Map<string, any>();
  private readonly configChangeSubject$ = new Subject<Record<string, any>>();

  get changes$(): Observable<Record<string, any>> {
    return this.configChangeSubject$.asObservable();
  }

  /**
   * Abstract method to load the configuration data.
   * @returns {Promise<Record<string, any>>} A promise that resolves with the configuration data.
   */
  abstract load(): Promise<Record<string, any>>;

  /**
   * Sets a configuration value to the in-memory store.
   */
  async set(key: string, value: any): Promise<void> {
    if (!this.config) {
      this.config = await this.load();
    }
    this.matchedResult.delete(key);
    this.config[key] = value;
    this.configChangeSubject$.next({
      [key]: value,
    });
  }

  /**
   * Retrieves all configuration data.
   * @returns {Promise<ObjectType>} A promise that resolves with the configuration data.
   */
  async getAll(): Promise<ObjectType> {
    if (!this.config) {
      this.config = await this.load();
    }
    return this.config;
  }

  /**
   * Retrieves a boolean value for a given key.
   * @param {string} key - The configuration key.
   * @param {boolean} [defaultValue] - The default value if the key is not found.
   * @returns {Promise<boolean>} A promise that resolves with the boolean value.
   */
  async getBoolean(key: string, defaultValue?: boolean): Promise<boolean> {
    const val = await this.get(key, defaultValue !== undefined ? `${defaultValue}` : undefined);
    const lowerVal = val?.toLowerCase();
    return lowerVal === 'true' || !!parseInt(lowerVal, 10);
  }

  /**
   * Retrieves a float value for a given key.
   * @param {string} key - The configuration key.
   * @param {number} [defaultValue] - The default value if the key is not found.
   * @returns {Promise<number>} A promise that resolves with the float value.
   */
  async getFloat(key: string, defaultValue?: number): Promise<number> {
    const val = await this.get(key, defaultValue !== undefined ? `${defaultValue}` : undefined);
    return parseFloat(val);
  }

  /**
   * Retrieves an integer value for a given key.
   * @param {string} key - The configuration key.
   * @param {number} [defaultValue] - The default value if the key is not found.
   * @returns {Promise<number>} A promise that resolves with the integer value.
   */
  async getInt(key: string, defaultValue?: number): Promise<number> {
    const val = await this.get(key, defaultValue !== undefined ? `${defaultValue}` : undefined);
    return parseInt(val, 10);
  }

  /**
   * Retrieves a string value for a given key.
   * @param {string} key - The configuration key.
   * @param {string} [defaultValue] - The default value if the key is not found.
   * @returns {Promise<string>} A promise that resolves with the string value.
   * @throws {ConfigNotFoundError} If the key is not found and no default value is provided.
   */
  async get(key: string, defaultValue?: string): Promise<string> {
    const returnDefaultOrThrow = () => {
      if (defaultValue === undefined) {
        throw new ConfigNotFoundError(`Config not found for key: ${key}`);
      }
      return defaultValue;
    };

    if (this.matchedResult.has(key)) {
      const value = this.matchedResult.get(key);
      if (value === EMPTY) {
        return returnDefaultOrThrow();
      }
    }

    // prettier-ignore
    const value =
      await this.getExactKey(key) ??
      await this.getUppercaseKey(key) ??
      await this.getCamelCaseKey(key) ??
      await this.getKebabCaseKey(key);

    this.matchedResult.set(key, value ?? EMPTY);

    if (value === undefined) {
      return returnDefaultOrThrow();
    }

    return value;
  }

  /**
   * Retrieves the exact key from the configuration data.
   * @param {string} key - The configuration key.
   * @returns {Promise<any>} A promise that resolves with the value of the key.
   */
  private async getExactKey(key: string): Promise<any> {
    const config = await this.getAll();
    if (key in config) {
      return config[key];
    }

    if (!key.includes('.')) {
      return undefined;
    }

    return JSONPath({ json: config, resultType: 'value', wrap: false, path: `$.${key}` });
  }

  /**
   * Retrieves the uppercase version of the key from the configuration data.
   * @param {string} key - The configuration key.
   * @returns {Promise<any>} A promise that resolves with the value of the key.
   */
  private getUppercaseKey(key: string): Promise<any> {
    return this.getExactKey(key.toUpperCase());
  }

  /**
   * Retrieves the camel case version of the key from the configuration data.
   * @param {string} key - The configuration key.
   * @returns {Promise<any>} A promise that resolves with the value of the key.
   */
  private getCamelCaseKey(key: string): Promise<any> {
    const effectiveKey = key.replace(/-([a-z])/g, (g) => g[1]!.toUpperCase());
    return this.getExactKey(effectiveKey) ?? this.getUppercaseKey(effectiveKey);
  }

  /**
   * Retrieves the kebab case version of the key from the configuration data.
   * @param {string} key - The configuration key.
   * @returns {Promise<any>} A promise that resolves with the value of the key.
   */
  private getKebabCaseKey(key: string): Promise<any> {
    const effectiveKey = key
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/-/g, '_')
      .toLowerCase();
    return this.getExactKey(effectiveKey) ?? this.getUppercaseKey(effectiveKey);
  }
}
