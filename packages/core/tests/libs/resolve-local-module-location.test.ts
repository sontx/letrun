import path from 'node:path';
import fs from 'fs';
import { getEntryPointDir } from '@letrun/core';
import { resolveLocalModuleLocation } from '@src/libs';

const jest = import.meta.jest;

describe('resolveLocalModuleLocation', () => {
  const customTasksDir = path.resolve('tasks');

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('resolves an absolute path', async () => {
    const absolutePath = path.resolve('/absolute/path/to/module.js');
    expect(await resolveLocalModuleLocation(absolutePath, customTasksDir)).toBe(absolutePath);
  });

  it('resolves a path from the current directory', async () => {
    const currentDirPath = path.resolve(process.cwd(), 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    expect(await resolveLocalModuleLocation('module.js', customTasksDir)).toBe(currentDirPath);
  });

  it('resolves a path from the runner directory', async () => {
    const runnerDirPath = path.resolve(getEntryPointDir(), 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(await resolveLocalModuleLocation('module.js', customTasksDir)).toBe(runnerDirPath);
  });

  it('resolves a path from the custom tasks directory', async () => {
    const customTasksDirPath = path.resolve(customTasksDir, 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(await resolveLocalModuleLocation('module.js', customTasksDir)).toBe(customTasksDirPath);
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
    expect(await resolveLocalModuleLocation('module', customTasksDir)).toBe(customTasksDirPathWithJs);
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
    expect(await resolveLocalModuleLocation('module.js', customTasksDir)).toBe(nodeModulesPath);
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

    expect(await resolveLocalModuleLocation(packageName, customTasksDir)).toBe(nodeModulesPath);
  });
});
