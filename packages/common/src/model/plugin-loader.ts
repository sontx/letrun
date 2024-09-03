import { Plugin } from './plugin';

/**
 * Interface representing a plugin loader.
 */
export interface PluginLoader {
  /**
   * Loads plugins.
   * @returns A promise that resolves to an array of plugins.
   */
  load(): Promise<Plugin[]>;
}
