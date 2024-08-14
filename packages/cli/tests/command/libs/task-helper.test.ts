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

  it('returns tasks matching the given name and group', () => {
    const result = TaskHelper.searchTasks(tasks, 'task1', 'group1');
    expect(result).toEqual([{ name: 'task1', path: 'group1/task1.js', group: 'group1' }]);
  });

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

  it('returns an empty array when no tasks are provided', () => {
    const result = TaskHelper.searchTasks([], 'task1', 'group1');
    expect(result).toEqual([]);
  });
});

describe('loadCustomTasksFromConfig', () => {
  it('handles missing task directory configuration', async () => {
    const context = {
      getConfigProvider: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue('tasks'),
      }),
    } as unknown as AppContext;

    jest.spyOn(TaskHelper as any, 'loadCustomTasks').mockResolvedValue([]);
    jest.spyOn(TaskHelper, 'getEntryPointDir').mockReturnValue('/entry/point/dir');

    const result = await TaskHelper.loadCustomTasksFromConfig(context);
    expect(result).toEqual([]);
    expect((TaskHelper as any).loadCustomTasks).toHaveBeenCalledWith(path.resolve('/entry/point/dir/tasks'), context);
  });
});
