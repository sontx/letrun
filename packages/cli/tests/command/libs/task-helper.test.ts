import { TaskHelper } from '@src/command/libs/task-helper';
import { AppContext } from '@letrun/core';
import path from 'node:path';

const jest = import.meta.jest;
(import.meta.jest as any).unstable_mockModule('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
  },
}));

describe('extractParentDirs', () => {
  it('handles paths with leading and trailing slashes', () => {
    const result = TaskHelper.extractParentDirs('/dir1/dir2/file.js/');
    expect(result).toEqual(['dir1', 'dir2', 'file.js']);
  });

  it('handles paths with multiple slashes', () => {
    const result = TaskHelper.extractParentDirs('dir1//dir2///file.js');
    expect(result).toEqual(['dir1', 'dir2']);
  });
});

describe('searchTasks', () => {
  const tasks = [
    { name: 'task1', path: 'group1/task1.js' },
    { name: 'task1', path: 'group2/task1.js' },
    { name: 'task2', path: 'group1/task2.js' },
  ];

  it('returns tasks matching the given name and group with null group', () => {
    const result = TaskHelper.searchTasks(tasks, 'task1', undefined);
    expect(result).toEqual([
      { name: 'task1', path: 'group1/task1.js', group: 'group1' },
      { name: 'task1', path: 'group2/task1.js', group: 'group2' },
    ]);
  });

  it('returns tasks matching the given name and group with empty string group', () => {
    const result = TaskHelper.searchTasks(tasks, 'task1', '');
    expect(result).toEqual([
      { name: 'task1', path: 'group1/task1.js', group: 'group1' },
      { name: 'task1', path: 'group2/task1.js', group: 'group2' },
    ]);
  });
});

describe('loadCustomTasksFromConfig', () => {
  it('handles missing task directory configuration', async () => {
    const context = {
      getConfigProvider: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue('tasks'),
      }),
    } as unknown as AppContext;

    jest.spyOn(TaskHelper, 'loadCustomTasks').mockResolvedValue([]);
    jest.spyOn(TaskHelper, 'getEntryPointDir').mockReturnValue('/entry/point/dir');

    const result = await TaskHelper.loadCustomTasksFromConfig(context);
    expect(result).toEqual([]);
    expect(TaskHelper.loadCustomTasks).toHaveBeenCalledWith(path.resolve('/entry/point/dir/tasks'), context);
  });
});

describe('loadCustomTasks', () => {
  it('handles empty task directory', async () => {
    const tasksDir = '/emptyTasks';
    jest.spyOn(TaskHelper, 'getAllJsFiles').mockResolvedValue([]);
    const context = {
      getLogger: jest.fn(() => ({ error: jest.fn() })),
    } as unknown as AppContext;
    const result = await TaskHelper.loadCustomTasks(tasksDir, context);
    expect(result).toEqual([]);
  });
});

describe('getAllJsFiles', () => {
  it('handles directories with no .js files', async () => {
    const dir = '/noJsFiles';
    const { promises } = await import('fs');
    (promises.readdir as jest.Mock).mockResolvedValueOnce(['file1.txt', 'file2.md']);
    const context = {
      getLogger: jest.fn(() => ({ error: jest.fn() })),
    } as unknown as AppContext;
    const result = await TaskHelper.getAllJsFiles(dir, context);
    expect(result).toEqual([]);
  });

  it('handles nested directories with no .js files', async () => {
    const dir = '/nestedNoJsFiles';
    const { promises } = await import('fs');
    (promises.readdir as jest.Mock).mockResolvedValueOnce(['subdir']);
    (promises.stat as jest.Mock).mockResolvedValueOnce({ isDirectory: () => true });
    (promises.readdir as jest.Mock).mockResolvedValueOnce(['file1.txt']);
    (promises.stat as jest.Mock).mockResolvedValueOnce({ isDirectory: () => false });
    const context = {
      getLogger: jest.fn(() => ({ error: jest.fn() })),
    } as unknown as AppContext;
    const result = await TaskHelper.getAllJsFiles(dir, context);
    expect(result).toEqual([]);
  });
});
