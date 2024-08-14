import { AppContext } from './app-context';

/**
 * Interface representing the lifecycle of a plugin.
 */
export interface PluginLifecycle {
  /**
   * Loads the plugin.
   * @param context - The application context.
   * @returns A promise that resolves when the plugin is loaded.
   */
  load(context: AppContext): Promise<void>;
  /**
   * Unloads the plugin.
   * @returns A promise that resolves when the plugin is unloaded.
   */
  unload(): Promise<void>;

  /**
   * Will be called when the plugin manager loaded all plugins.
   * This is useful when the plugin needs to interact with other plugins.
   */
  ready?(context: AppContext): Promise<void>;
}

/**
 * Interface representing a plugin.
 * Extends the PluginLifecycle interface.
 */
export interface Plugin extends PluginLifecycle {
  /** The name of the plugin. */
  readonly name: string;
  /** The type of the plugin. There may be multiple plugins with the same type but different names. */
  readonly type: string;
  /** If there are multiple names of this plugin type, the highest priority is prioritized for use. Default is 0 */
  readonly priority?: number;
  /** Additional properties for the plugin. */
  [key: string]: any;
}

/**
 * Interface representing an executable plugin.
 * Extends the Plugin interface.
 * @template T - The type of the input for the plugin.
 */
export interface ExecutablePlugin<T = any> extends Plugin {
  /**
   * Executes the plugin.
   * @param input - The input for the plugin.
   * @returns A promise that resolves to the output of the plugin.
   */
  execute(input: T): Promise<any>;
}
