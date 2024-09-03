import {
  AbstractPlugin,
  BUILTIN_PLUGIN_PRIORITY,
  MODULE_LOCATION_RESOLVER_PLUGIN,
  resolveLocalModuleLocation,
} from '@letrun/core';
import { InvalidParameterError } from "@letrun/common";

export default class DefaultModuleLocationResolver extends AbstractPlugin {
  readonly name = 'default';
  readonly type = MODULE_LOCATION_RESOLVER_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  private readonly cachedLocations = new Map<string, string>();

  constructor() {
    super();
    this.resolveLocation = this.resolveLocation.bind(this);
  }

  /**
   * We will look up in this order:
   * 1. if this is an absolute path, we will use it as is
   * 2. resolve it from the current directory
   * 3. resolve it from the runner directory
   * 4. lookup in the custom tasks directory (default is tasks directory)
   * 5. lookup in the node_modules directory (module name may be extracted from the package name: @letrun/core@0.0.1 -> @letrun/core)
   * 6. append the .js extension if missing, then look up in the custom tasks directory (default is tasks directory)
   */
  async resolveLocation(module: string, modulesDir?: string, throwsIfNotFound?: boolean) {
    if (this.cachedLocations.has(module)) {
      return this.cachedLocations.get(module)!;
    }

    return await this.resolveAndCache(module, modulesDir, throwsIfNotFound);
  }

  private async resolveAndCache(module: string, modulesDir: string | undefined, throwsIfNotFound: boolean | undefined) {
    const location = await resolveLocalModuleLocation(module, modulesDir);

    if (!location && throwsIfNotFound) {
      throw new InvalidParameterError(`Cannot find module: ${module}, we looked up in this order:
1. If this is an absolute path, we will use it as is
2. Resolve it from the current directory
3. Resolve it from the runner directory
4. Lookup in the custom tasks directory (default is tasks directory)
5. Lookup in the node_modules directory (module name may be extracted from the package name: @letrun/core@0.0.1 -> @letrun/core)
6. Append the .js extension if missing, then look up in the custom tasks directory (default is tasks directory)`);
    }

    if (location) {
      this.cachedLocations.set(module, location);
    }

    return location;
  }
}
