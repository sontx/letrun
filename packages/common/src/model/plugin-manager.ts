import { FunctionKeys } from '@src/types';

import { AppContext } from './app-context';
import { Plugin } from './plugin';

/**
 * Interface representing a plugin manager.
 */
export interface PluginManager {
  /**
   * Registers a plugin.
   * @param plugin - The plugin to register.
   */
  register(plugin: Plugin): void;

  /**
   * Gets all registered plugins.
   */
  getAll(): Promise<Map<string, Plugin[]>>;

  /**
   * Gets plugins of a specific type.
   * @template T - The type of the plugins.
   * @param type - The type of the plugins.
   * @returns A promise that resolves to an array of plugins.
   */
  get<T extends Plugin>(type: string): Promise<T[]>;
  /**
   * Gets a single plugin of a specific type.
   * @template T - The type of the plugin.
   * @param type - The type of the plugin.
   * @returns A promise that resolves to the plugin.
   */
  getOne<T extends Plugin>(type: string): Promise<T>;
  /**
   * Calls a method on a plugin.
   * @template TPlugin - The type of the plugin.
   * @template TResult - The type of the result.
   * @param type - The type of the plugin.
   * @param method - The method to call.
   * @param args - The arguments for the method.
   * @returns A promise that resolves to the result of the method.
   */
  callPluginMethod<TPlugin extends Plugin = any, TResult = any>(
    type: string,
    method: FunctionKeys<TPlugin>,
    ...args: any[]
  ): Promise<TResult | undefined>;
  /**
   * Loads the plugin manager. All the plugins will also be loaded.
   * @param context - The application context.
   */
  load(context: AppContext): Promise<void>;
  /**
   * Unloads the plugin manager.
   * @returns A promise that resolves when the plugin manager is unloaded.
   */
  unload(): Promise<void>;
}
