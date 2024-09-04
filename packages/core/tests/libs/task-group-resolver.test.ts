import { TaskGroupResolver } from '@src/libs/task-group-resolver';
import { ModuleResolverFn } from '@src/libs/module-resolver';
import { UNCATEGORIZED_TASK_GROUP } from '@letrun/common';

const jest = import.meta.jest;

describe('TaskGroupResolver', () => {
  let taskGroupResolver: TaskGroupResolver;
  let mockModuleResolver: jest.MockedFunction<ModuleResolverFn>;

  beforeEach(() => {
    mockModuleResolver = jest.fn();
    taskGroupResolver = new TaskGroupResolver(mockModuleResolver);
  });

  it('resolves uncategorized task group when module has default export', async () => {
    class mockHandler {
      name = 'mockTask';
      handle() {}
    }
    mockModuleResolver.mockResolvedValue({ default: mockHandler });

    const result = await taskGroupResolver.resolve('/path/to/task');

    expect(result).toEqual({
      ...UNCATEGORIZED_TASK_GROUP,
      tasks: {
        mockTask: expect.any(mockHandler),
      },
    });
  });

  it('resolves task group from package.json', async () => {
    class mockHandler {
      name = 'mockTask';
      handle() {}
    }
    mockModuleResolver.mockResolvedValue({ mockTask: mockHandler });
    jest.spyOn(taskGroupResolver as any, 'readPackageJson').mockResolvedValue({
      name: 'mockPackage',
      description: 'mockDescription',
      version: '1.0.0',
      author: 'mockAuthor',
    });

    const result = await taskGroupResolver.resolve('/path/to/task');

    expect(result).toEqual({
      name: 'mockPackage',
      description: 'mockDescription',
      version: '1.0.0',
      author: 'mockAuthor',
      tasks: {
        mockTask: expect.any(mockHandler),
      },
    });
  });

  it('throws error when no default export and no package.json', async () => {
    mockModuleResolver.mockResolvedValue({});
    jest.spyOn(taskGroupResolver as any, 'readPackageJson').mockResolvedValue(null);

    await expect(taskGroupResolver.resolve('/path/to/task')).rejects.toThrow(
      'No default export found in /path/to/task, task group is only supported for node modules but standalone scripts tasks are not.',
    );
  });

  it('resolves module name from node_modules path', () => {
    const result = taskGroupResolver['getModuleName']('/path/to/node_modules/some-module');
    expect(result).toBe('some-module');
  });

  it('returns null for non-node_modules path', () => {
    const result = taskGroupResolver['getModuleName']('/path/to/some-module');
    expect(result).toBeNull();
  });

  it('resolves scoped package name from node_modules path', () => {
    const result = taskGroupResolver['getModuleName']('/path/to/node_modules/@scope/some-module');
    expect(result).toBe('@scope/some-module');
  });

  it('throws error for duplicate task handler names', async () => {
    class mockHandler {
      name = 'mockTask';
      handle() {}
    }
    mockHandler.prototype.name = 'mockTask';
    mockModuleResolver.mockResolvedValue({ mockTask1: mockHandler, mockTask2: mockHandler });
    jest.spyOn(taskGroupResolver as any, 'readPackageJson').mockResolvedValue({
      name: 'mockPackage',
    });

    await expect(taskGroupResolver.resolve('/path/to/task')).rejects.toThrow(
      'Task handler mockTask2 has a duplicate name mockTask. Please provide a unique name for the task handler.',
    );
  });

  it('resolves multiple task handlers correctly', async () => {
    class mockHandler1 {
      name = 'mockTask1';
      handle() {}
    }
    mockHandler1.prototype.name = 'mockTask1';
    class mockHandler2 {
      name = 'mockTask2';
      handle() {}
    }
    mockModuleResolver.mockResolvedValue({ mockTask1: mockHandler1, mockTask2: mockHandler2 });
    jest.spyOn(taskGroupResolver as any, 'readPackageJson').mockResolvedValue({
      name: 'mockPackage',
    });

    const result = await taskGroupResolver.resolve('/path/to/task');

    expect(result).toEqual({
      name: 'mockPackage',
      tasks: {
        mockTask1: expect.any(mockHandler1),
        mockTask2: expect.any(mockHandler2),
      },
    });
  });

  it('filters out invalid task handlers', async () => {
    class validHandler {
      name = 'validTask';
      handle() {}
    }
    const invalidHandler = {};
    mockModuleResolver.mockResolvedValue({ validTask: validHandler, invalidTask: invalidHandler });
    jest.spyOn(taskGroupResolver as any, 'readPackageJson').mockResolvedValue({
      name: 'mockPackage',
    });

    const result = await taskGroupResolver.resolve('/path/to/task');

    expect(result).toEqual({
      name: 'mockPackage',
      tasks: {
        validTask: expect.any(validHandler),
      },
    });
  });

  it('returns null if package.json does not exist', async () => {
    jest.spyOn(taskGroupResolver as any, 'readPackageJson').mockResolvedValue(null);

    const result = await (taskGroupResolver as any).readPackageJson('/path/to/nonexistent/package');

    expect(result).toBeNull();
  });

  it('resolves task group with default and other keys correctly', async () => {
    class defaultHandler {
      name = 'defaultTask';
      handle() {}
    }
    class otherHandler {
      name = 'otherTask';
      handle() {}
    }
    mockModuleResolver.mockResolvedValue({ default: defaultHandler, otherTask: otherHandler });
    jest.spyOn(taskGroupResolver as any, 'readPackageJson').mockResolvedValue({
      name: 'mockPackage',
    });

    const result = await taskGroupResolver.resolve('/path/to/task');

    expect(result).toEqual({
      name: 'mockPackage',
      tasks: {
        defaultTask: expect.any(defaultHandler),
        otherTask: expect.any(otherHandler),
      },
    });
  });

  it('filters out task handlers without handle method', async () => {
    class validHandler {
      name = 'validTask';
      handle() {}
    }
    class invalidHandler {
      name = 'invalidTask';
    }
    mockModuleResolver.mockResolvedValue({ validTask: validHandler, invalidTask: invalidHandler });
    jest.spyOn(taskGroupResolver as any, 'readPackageJson').mockResolvedValue({
      name: 'mockPackage',
    });

    const result = await taskGroupResolver.resolve('/path/to/task');

    expect(result).toEqual({
      name: 'mockPackage',
      tasks: {
        validTask: expect.any(validHandler),
      },
    });
  });
});
