import { ObjectType } from '@src/types';
import {Observable} from "rxjs";

/**
 * Interface representing a configuration provider.
 */
export interface ConfigProvider {
  /**
   * Gets all configuration values.
   * @returns A promise that resolves to an object containing all configuration values.
   */
  getAll(): Promise<ObjectType>;

  /**
   * Gets a configuration value.
   * @param key - The key of the configuration value.
   * @param defaultValue - The default value if the key is not found.
   * @returns A promise that resolves to the configuration value.
   */
  get(key: string, defaultValue?: string): Promise<string>;

  /**
   * Gets a configuration value as an integer.
   * @param key - The key of the configuration value.
   * @param defaultValue - The default value if the key is not found.
   * @returns A promise that resolves to the configuration value as an integer.
   */
  getInt(key: string, defaultValue?: number): Promise<number>;

  /**
   * Gets a configuration value as a float.
   * @param key - The key of the configuration value.
   * @param defaultValue - The default value if the key is not found.
   * @returns A promise that resolves to the configuration value as a float.
   */
  getFloat(key: string, defaultValue?: number): Promise<number>;

  /**
   * Gets a configuration value as a boolean.
   * @param key - The key of the configuration value.
   * @param defaultValue - The default value if the key is not found.
   * @returns A promise that resolves to the configuration value as a boolean.
   */
  getBoolean(key: string, defaultValue?: boolean): Promise<boolean>;

  /**
   * Sets a configuration value to the in-memory store.
   */
  set(key: string, value: any): Promise<void>;

  /**
   * Fires when a configuration value changes at runtime.
   */
  get changes$(): Observable<Record<string, any>>;
}
