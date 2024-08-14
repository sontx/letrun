import { ConfigProvider } from './config-provider';
import { Logger } from './logger';
import { PluginManager } from '@src/model/plugin-manager';

/**
 * Interface representing the application context.
 */
export interface AppContext {
  /**
   * Loads the application context.
   * @returns A promise that resolves when the context is loaded.
   */
  load(): Promise<void>;

  /**
   * Unloads the application context.
   * @returns A promise that resolves when the context is unloaded.
   */
  unload(): Promise<void>;

  /**
   * Gets the plugin manager.
   * @returns The plugin manager.
   */
  getPluginManager(): PluginManager;

  /**
   * Gets the configuration provider.
   * @returns The configuration provider.
   */
  getConfigProvider(): ConfigProvider;

  /**
   * Gets the logger.
   * @returns The logger.
   */
  getLogger(): Logger;
}
