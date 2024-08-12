import { AppContext, ConfigProvider, Logger, PluginLoader, PluginManager } from '@letrun/core';
import { FilePluginLoader, SimplePluginManager } from '../plugin';
import { LoggerModule } from '../logger';
import { ChainConfigProvider } from '../config';

/**
 * Interface representing the options for the DefaultContext.
 */
interface Options {
  /**
   * The configuration provider.
   * @type {ConfigProvider}
   */
  configProvider?: ConfigProvider;

  /**
   * The plugin manager.
   * @type {PluginManager}
   */
  pluginManager?: PluginManager;

  /**
   * The plugin loader.
   * @type {PluginLoader}
   */
  pluginLoader?: PluginLoader;
}

/**
 * Class representing the default application context.
 * Implements the AppContext interface.
 */
export class DefaultContext implements AppContext {
  private readonly loggerModule: LoggerModule = new LoggerModule();
  private readonly configProvider: ConfigProvider;
  private readonly pluginManager: PluginManager;
  private pluginLoader?: PluginLoader;
  private loaded = false;

  /**
   * Creates an instance of DefaultContext.
   * @param {Options} [options={}] - The options for the context.
   */
  constructor(options: Options = {}) {
    this.configProvider = options.configProvider ?? new ChainConfigProvider();
    this.pluginManager = options.pluginManager ?? new SimplePluginManager();
    this.pluginLoader = options.pluginLoader;
  }

  /**
   * Loads the application context.
   * @returns {Promise<void>} A promise that resolves when the context is loaded.
   */
  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    await this.initPluginManager();
    await this.loggerModule.load(this);
    this.loaded = true;
    this.getLogger().info('App context loaded');
  }

  /**
   * Initializes the plugin manager.
   * @private
   * @returns {Promise<void>} A promise that resolves when the plugin manager is initialized.
   */
  private async initPluginManager(): Promise<void> {
    if (!this.pluginLoader) {
      const pluginDir = await this.configProvider.get('plugin.dir', 'plugins');
      this.pluginLoader = new FilePluginLoader(pluginDir);
    }
    const plugins = await this.pluginLoader.load();
    for (const plugin of plugins) {
      this.pluginManager.register(plugin);
    }
    this.pluginManager.load(this);
  }

  /**
   * Unloads the application context.
   * @returns {Promise<void>} A promise that resolves when the context is unloaded.
   */
  async unload(): Promise<void> {
    if (!this.loaded) {
      return;
    }

    this.getLogger().info('App context unloaded');
    await this.pluginManager?.unload();
    await this.loggerModule?.unload();
    this.loaded = false;
  }

  /**
   * Retrieves the plugin manager.
   * @returns {PluginManager} The plugin manager instance.
   */
  getPluginManager(): PluginManager {
    return this.pluginManager!;
  }

  /**
   * Retrieves the configuration provider.
   * @returns {ConfigProvider} The configuration provider instance.
   */
  getConfigProvider(): ConfigProvider {
    return this.configProvider;
  }

  /**
   * Retrieves the logger instance.
   * @returns {Logger} The logger instance.
   */
  getLogger(): Logger {
    return this.loggerModule.getLogger();
  }
}
