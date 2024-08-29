import DefaultModuleLocationResolver from '@src/default-module-location-resolver';
import path from 'node:path';
import fs from 'fs';
import { getEntryPointDir } from '@letrun/core';

const jest = import.meta.jest;

describe('resolveLocation', () => {
  const customTasksDir = path.resolve('tasks');
  let resolver: DefaultModuleLocationResolver;

  beforeEach(() => {
    resolver = new DefaultModuleLocationResolver();
    jest.resetAllMocks();
  });

  it('resolves an absolute path', async () => {
    const absolutePath = path.resolve('/absolute/path/to/module.js');
    expect(await resolver.resolveLocation(absolutePath, customTasksDir)).toBe(absolutePath);
  });

  it('resolves a path from the current directory', async () => {
    const currentDirPath = path.resolve(process.cwd(), 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    expect(await resolver.resolveLocation('module.js', customTasksDir)).toBe(currentDirPath);
  });

  it('resolves a path from the runner directory', async () => {
    const runnerDirPath = path.resolve(getEntryPointDir(), 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(await resolver.resolveLocation('module.js', customTasksDir)).toBe(runnerDirPath);
  });

  it('resolves a path from the custom tasks directory', async () => {
    const customTasksDirPath = path.resolve(customTasksDir, 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(await resolver.resolveLocation('module.js', customTasksDir)).toBe(customTasksDirPath);
  });

  it('resolves a path with .js extension from the custom tasks directory', async () => {
    const customTasksDirPathWithJs = path.resolve(customTasksDir, 'module.js');
    jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    expect(await resolver.resolveLocation('module', customTasksDir)).toBe(customTasksDirPathWithJs);
  });

  it('resolves a path from the node_modules directory', async () => {
    const nodeModulesPath = path.resolve(getEntryPointDir(), 'node_modules', 'module.js');
    jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    expect(await resolver.resolveLocation('module.js', customTasksDir)).toBe(nodeModulesPath);
  });

  it('throws an error when module is not found and throwsIfNotFound is true', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    await expect(resolver.resolveLocation('nonexistentModule', customTasksDir, true)).rejects.toThrow(
      'Cannot find module: nonexistentModule',
    );
  });

  it('returns null when module is not found and throwsIfNotFound is false', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(await resolver.resolveLocation('nonexistentModule', customTasksDir, false)).toBeNull();
  });

  it('resolves a package name from the node_modules directory', async () => {
    const packageName = '@letrun/core@0.0.1';
    const nodeModulesPath = path.resolve(getEntryPointDir(), 'node_modules', '@letrun/core');
    jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    expect(await resolver.resolveLocation(packageName, customTasksDir)).toBe(nodeModulesPath);
  });

  it('caches the resolved location', async () => {
    const moduleName = 'module.js';

    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    const resolveAndCacheSpy = jest.spyOn(resolver as any, 'resolveAndCache');

    // First call to resolveLocation
    const location1 = await resolver.resolveLocation(moduleName, customTasksDir);

    // Second call to resolveLocation should use the cached location
    const location2 = await resolver.resolveLocation(moduleName, customTasksDir);
    expect(location2).toBe(location1);

    // Ensure resolveAndCache is called only once
    expect(resolveAndCacheSpy).toHaveBeenCalledTimes(1);
  });
});
