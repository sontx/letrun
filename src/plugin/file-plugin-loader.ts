import {getEntryPointDir, importDefault, Plugin, PluginLoader} from '@letrun/core';
import fs from 'fs/promises';
import path from 'node:path';
import { DEFAULT_LOGGER } from '../logger';

/**
 * Class representing a file-based plugin loader.
 * Implements the PluginLoader interface.
 */
export class FilePluginLoader implements PluginLoader {
  private readonly pluginDir: string;
  private plugins?: Plugin[];

  /**
   * Creates an instance of FilePluginLoader.
   * @param {string} [pluginDir='plugins'] - The directory containing the plugin files.
   */
  constructor(pluginDir: string = 'plugins') {
    this.pluginDir = path.resolve(getEntryPointDir(), pluginDir);
  }

  /**
   * Loads the plugins from the specified directory.
   * @returns {Promise<Plugin[]>} A promise that resolves with the loaded plugins.
   */
  async load(): Promise<Plugin[]> {
    if (!this.plugins) {
      const files = await fs.readdir(this.pluginDir);
      const plugins: Plugin[] = [];
      for (const file of files.filter((file) => file.endsWith('.js') || file.endsWith('.cjs'))) {
        const pluginFile = path.resolve(this.pluginDir, file);
        try {
          const plugin = await importDefault(pluginFile);
          if (!plugin) {
            DEFAULT_LOGGER.warn(`No default export found in ${pluginFile}`);
          } else {
            plugins.push(plugin);
          }
        } catch (e: any) {
          DEFAULT_LOGGER.error(`Failed to load plugin from ${pluginFile}: ${e.message}`);
        }
      }
      this.plugins = plugins;
    }

    return this.plugins;
  }
}
