import { Plugin } from '@letrun/common';

/**
 * Constant representing the module location resolver plugin type.
 * @type {string}
 */
export const MODULE_LOCATION_RESOLVER_PLUGIN: string = 'module-location-resolver';

export type LocationResolverFn = (module: string, modulesDir?: string) => Promise<string | null>;

/**
 * Interface for a module location resolver plugin.
 * Extends the Plugin interface.
 *
 * @interface ModuleLocationResolver
 * @extends {Plugin}
 */
export interface ModuleLocationResolver extends Plugin {
  /**
   * The type of the plugin, which is a constant string 'module-location-resolver'.
   * @type {typeof MODULE_LOCATION_RESOLVER_PLUGIN}
   */
  readonly type: typeof MODULE_LOCATION_RESOLVER_PLUGIN;

  /**
   * Resolves the location of a module.
   *
   * @param {string} module - The name or path of the module to resolve.
   * @param {string} [modulesDir] - Optional directory to resolve the module from.
   * @param {boolean} [throwsIfNotFound] - Optional flag to throw an error if the module is not found.
   * @returns {Promise<string>} - A promise that resolves to the resolved module location.
   */
  resolveLocation(module: string, modulesDir?: string, throwsIfNotFound?: boolean): Promise<string>;
}
