import { getEntryPointDir, importDefault, Plugin, PluginLoader } from '@letrun/core';
import fs from 'fs';
import path from 'node:path';
import { DEFAULT_LOGGER } from '@src/libs/log-helper';

/**
 * Class representing a file-based plugin loader.
 * Implements the PluginLoader interface.
 */
export class FilePluginLoader implements PluginLoader {
  private readonly pluginDir: string;
  private plugins?: Plugin[];

  constructor(
    pluginDir: string = 'plugins',
    private readonly moduleResolver = importDefault,
  ) {
    this.pluginDir = path.resolve(getEntryPointDir(), pluginDir);
  }

  /**
   * Loads the plugins from the specified directory.
   * @returns {Promise<Plugin[]>} A promise that resolves with the loaded plugins.
   */
  async load(): Promise<Plugin[]> {
    if (!this.plugins) {
      if (!fs.existsSync(this.pluginDir)) {
        DEFAULT_LOGGER.debug(`Plugin directory not found: ${this.pluginDir}`);
        this.plugins = [];
        return this.plugins;
      }

      const files = await fs.promises.readdir(this.pluginDir);
      const plugins: Plugin[] = [];
      for (const file of files.filter((file) => file.endsWith('.js') || file.endsWith('.cjs'))) {
        const pluginFile = path.resolve(this.pluginDir, file);
        try {
          const pluginClass = await this.moduleResolver(pluginFile);
          if (!pluginClass) {
            DEFAULT_LOGGER.warn(`No default export found in ${pluginFile}`);
          } else {
            const plugin = new pluginClass();
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
