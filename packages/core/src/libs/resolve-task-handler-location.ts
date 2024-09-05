import path from 'node:path';
import fs from 'fs';
import { getEntryPointDir } from '@src/utils';
import { LocationResolverFn } from '@src/plugin';
import { ParsedHandler } from '@letrun/common';

export const resolveTaskHandlerLocation: LocationResolverFn = async (handler: ParsedHandler, tasksDir?: string) => {
  return handler.type === 'package'
    ? resolvePackageLocation(handler.name)
    : resolveExternalLocation(handler.name, tasksDir);
};

function resolvePackageLocation(name: string) {
  const nodeModulesPath = path.resolve(getEntryPointDir(), 'node_modules');
  const modulePath = path.resolve(nodeModulesPath, name);
  return fs.existsSync(modulePath) ? modulePath : null;
}

function resolveExternalLocation(name: string, tasksDir?: string) {
  if (path.isAbsolute(name)) {
    return fs.existsSync(name) ? name : null;
  }

  const pathResolvedFromCurrentDir = path.resolve(process.cwd(), name);
  if (fs.existsSync(pathResolvedFromCurrentDir)) {
    return pathResolvedFromCurrentDir;
  }

  const pathResolvedFromRunnerDir = path.resolve(getEntryPointDir(), name);
  if (fs.existsSync(pathResolvedFromRunnerDir)) {
    return pathResolvedFromRunnerDir;
  }

  if (tasksDir) {
    const pathResolvedFromCustomTasksDir = path.resolve(tasksDir, name);
    if (fs.existsSync(pathResolvedFromCustomTasksDir)) {
      return pathResolvedFromCustomTasksDir;
    }
  }

  return null;
}
