import {
  AppContext,
  ConfigProvider,
  Logger,
  LOGGER_PLUGIN,
  LoggerPlugin,
  PluginLoader,
  PluginManager,
} from '@letrun/core';
import { FilePluginLoader, SimplePluginManager } from '../plugin';
import { ChainConfigProvider } from '../config';
import { DefaultPluginLoader } from '@letrun/plugin';
import { DEFAULT_LOGGER } from '@src/libs/log-helper';

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

  defaultPluginLoader?: PluginLoader;
}

/**
 * Class representing the default application context.
 * Implements the AppContext interface.
 */
export class DefaultContext implements AppContext {
  private readonly configProvider: ConfigProvider;
  private readonly pluginManager: PluginManager;
  private defaultPluginLoader?: PluginLoader;
  private pluginLoader?: PluginLoader;
  private logger: Logger = DEFAULT_LOGGER;
  private loaded = false;

  constructor(options: Options = {}) {
    this.configProvider = options.configProvider ?? new ChainConfigProvider();
    this.pluginManager = options.pluginManager ?? new SimplePluginManager();
    this.pluginLoader = options.pluginLoader;
    this.defaultPluginLoader = options.defaultPluginLoader;
  }

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    await this.initPluginManager();
    await this.initLogger();

    this.getLogger().debug('App context loaded');
    this.loaded = true;
  }

  private async initPluginManager(): Promise<void> {
    await this.loadDefaultPlugins();
    await this.loadCustomPlugins();
    await this.pluginManager.load(this);
  }

  private async initLogger() {
    const loggerPlugin = await this.pluginManager.getOne<LoggerPlugin>(LOGGER_PLUGIN);
    this.logger = loggerPlugin.getLogger();
  }

  private async loadDefaultPlugins() {
    const defaultPluginLoader = this.defaultPluginLoader ?? new DefaultPluginLoader();
    const plugins = await defaultPluginLoader.load();
    for (const plugin of plugins) {
      this.pluginManager.register(plugin);
    }
  }

  private async loadCustomPlugins() {
    if (!this.pluginLoader) {
      const pluginDir = await this.configProvider.get('plugin.dir', 'plugins');
      this.pluginLoader = new FilePluginLoader(pluginDir);
    }
    const plugins = await this.pluginLoader.load();
    for (const plugin of plugins) {
      this.pluginManager.register(plugin);
    }
  }

  async unload(): Promise<void> {
    if (!this.loaded) {
      return;
    }

    this.getLogger().debug('App context unloaded');
    await this.pluginManager?.unload();
    this.loaded = false;
  }

  getPluginManager(): PluginManager {
    return this.pluginManager!;
  }

  getConfigProvider(): ConfigProvider {
    return this.configProvider;
  }

  getLogger(): Logger {
    return this.logger;
  }
}
