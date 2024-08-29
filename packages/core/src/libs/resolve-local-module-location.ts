import path from 'node:path';
import fs from 'fs';
import { extractPackageNameVersion, getEntryPointDir } from '@src/utils';
import { LocationResolverFn } from '@src/plugin';

/**
 * We will look up in this order:
 * 1. if this is an absolute path, we will use it as is
 * 2. resolve it from the current directory
 * 3. resolve it from the runner directory
 * 4. lookup in the custom modules directory if specified
 * 5. lookup in the node_modules directory (module name may be extracted from the package name: @letrun/core@0.0.1 -> @letrun/core)
 * 6. append the .js extension if missing, then look up in the custom modules directory if specified
 */
export const resolveLocalModuleLocation: LocationResolverFn = async (module: string, modulesDir?: string) => {
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
  }

  const { name: effectiveModuleName = '' } = extractPackageNameVersion(module);
  const pathResolvedFromNodeModulesDir = path.resolve(getEntryPointDir(), 'node_modules', effectiveModuleName);
  if (fs.existsSync(pathResolvedFromNodeModulesDir)) {
    return pathResolvedFromNodeModulesDir;
  }

  if (modulesDir) {
    const locationWithJsExtension = module.endsWith('.js') ? module : `${module}.js`;
    const pathResolvedFromCustomTasksDir = path.resolve(modulesDir, locationWithJsExtension);
    if (fs.existsSync(pathResolvedFromCustomTasksDir)) {
      return pathResolvedFromCustomTasksDir;
    }
  }

  return null;
};
