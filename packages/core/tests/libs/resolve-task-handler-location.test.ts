import path from 'node:path';
import fs from 'fs';
import { getEntryPointDir } from '@letrun/core';
import { resolveTaskHandlerLocation } from '@src/libs';
import { ParsedHandler } from '@letrun/common';

const jest = import.meta.jest;

describe('resolveTaskHandlerLocation', () => {
  const customTasksDir = path.resolve('tasks');

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('resolves an absolute path', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    const absolutePath = path.resolve('/absolute/path/to/module.js');
    expect(
      await resolveTaskHandlerLocation(
        {
          type: 'script',
          name: absolutePath,
        },
        customTasksDir,
      ),
    ).toBe(absolutePath);
  });

  it('returns null when absolute path does not exist', async () => {
    const absolutePath = path.resolve('/absolute/path/to/module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);
    expect(
      await resolveTaskHandlerLocation(
        {
          type: 'script',
          name: absolutePath,
        },
        customTasksDir,
      ),
    ).toBeNull();
  });

  it('resolves a path from the current directory', async () => {
    const currentDirPath = path.resolve(process.cwd(), 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    expect(
      await resolveTaskHandlerLocation(
        {
          type: 'script',
          name: 'module.js',
        },
        customTasksDir,
      ),
    ).toBe(currentDirPath);
  });

  it('resolves a path from the runner directory', async () => {
    const runnerDirPath = path.resolve(getEntryPointDir(), 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(
      await resolveTaskHandlerLocation(
        {
          type: 'script',
          name: 'module.js',
        },
        customTasksDir,
      ),
    ).toBe(runnerDirPath);
  });

  it('resolves a path from the custom tasks directory', async () => {
    const customTasksDirPath = path.resolve(customTasksDir, 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(
      await resolveTaskHandlerLocation(
        {
          type: 'script',
          name: 'module.js',
        },
        customTasksDir,
      ),
    ).toBe(customTasksDirPath);
  });

  it('returns null when path does not exist', async () => {
    const nonExistentPath = 'non/existent/path/to/module.js';
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(
      await resolveTaskHandlerLocation(
        {
          type: 'script',
          name: nonExistentPath,
        },
        customTasksDir,
      ),
    ).toBeNull();
  });

  it('resolves package location when handler type is package', async () => {
    const handler: ParsedHandler = { type: 'package', name: 'some-package' };
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    const nodeModulesPath = path.resolve(getEntryPointDir(), 'node_modules');
    const modulePath = path.resolve(nodeModulesPath, 'some-package');
    expect(await resolveTaskHandlerLocation(handler, customTasksDir)).toBe(modulePath);
  });

  it('returns null when package location does not exist', async () => {
    const handler: ParsedHandler = { type: 'package', name: 'some-package' };
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);
    expect(await resolveTaskHandlerLocation(handler, customTasksDir)).toBeNull();
  });
});
