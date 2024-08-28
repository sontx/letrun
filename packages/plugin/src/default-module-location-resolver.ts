import {
  AbstractPlugin,
  BUILTIN_PLUGIN_PRIORITY,
  getEntryPointDir,
  InvalidParameterError,
  MODULE_LOCATION_RESOLVER_PLUGIN,
} from '@letrun/core';
import path from 'node:path';
import fs from 'fs';

export default class DefaultModuleLocationResolver extends AbstractPlugin {
  readonly name = 'default';
  readonly type = MODULE_LOCATION_RESOLVER_PLUGIN;
  readonly priority = BUILTIN_PLUGIN_PRIORITY;

  /**
   * We will look up in this order:
   * 1. if this is an absolute path, we will use it as is
   * 2. resolve it from the current directory
   * 3. resolve it from the runner directory
   * 4. lookup in the custom tasks directory (default is tasks directory)
   * 5. append the .js extension if missing, then look up in the custom tasks directory (default is tasks directory)
   */
  async resolveLocation(module: string, modulesDir?: string, throwsIfNotFound?: boolean) {
    if (path.isAbsolute(module)) {
      return module;
    }

    const pathResolvedFromCurrentDir = path.resolve(process.cwd(), module);
    if (fs.existsSync(pathResolvedFromCurrentDir)) {
      return pathResolvedFromCurrentDir;
    }

    const pathResolvedFromRunnerDir = path.resolve(getEntryPointDir(), module);
    if (fs.existsSync(pathResolvedFromRunnerDir)) {
      return pathResolvedFromRunnerDir;
    }

    if (modulesDir) {
      const dirPathResolvedFromCustomTasksDir = path.resolve(modulesDir, module);
      if (fs.existsSync(dirPathResolvedFromCustomTasksDir)) {
        return dirPathResolvedFromCustomTasksDir;
      }

      const locationWithJsExtension = module.endsWith('.js') ? module : `${module}.js`;
      const pathResolvedFromCustomTasksDir = path.resolve(modulesDir, locationWithJsExtension);
      if (fs.existsSync(pathResolvedFromCustomTasksDir)) {
        return pathResolvedFromCustomTasksDir;
      }
    }

    if (throwsIfNotFound) {
      throw new InvalidParameterError(`Cannot find module: ${module}, we looked up in this order:
1. If this is an absolute path, we will use it as is
2. Resolve it from the current directory
3. Resolve it from the runner directory
4. Lookup in the custom tasks directory (default is tasks directory)
5. Append the .js extension if missing, then look up in the custom tasks directory (default is tasks directory)`);
    }

    return null;
  }
}
