import DefaultTaskInvoker from '@src/default-task-invoker';
import { getEntryPointDir, TaskHandlerInput } from '@letrun/core';
import { InvalidParameterError } from '@letrun/core/dist';
import path from 'node:path';
import fs from 'fs';
import { Subject } from 'rxjs';

const jest = import.meta.jest;

describe('DefaultTaskInvoker', () => {
  const customTasksDir = path.resolve('tasks');
  let invoker: DefaultTaskInvoker;

  beforeEach(() => {
    invoker = new DefaultTaskInvoker();
  });

  it('invokes a system task and returns the result', async () => {
    const systemTaskHandler = jest.fn().mockResolvedValue({ result: 'system task result' });
    const input = {
      task: { taskDef: { handler: 'systemTask' } },
      session: { systemTasks: { systemTask: { handle: systemTaskHandler } } },
      context: { getLogger: jest.fn().mockReturnValue({ verbose: jest.fn() }) },
    } as unknown as TaskHandlerInput;

    const invoker = new DefaultTaskInvoker();
    const result = await invoker.invoke(input);
    expect(result).toEqual({ result: 'system task result' });
    expect(systemTaskHandler).toHaveBeenCalledWith(input);
  });

  it('invokes an external task and returns the result', async () => {
    const externalTaskHandler = jest.fn().mockResolvedValue({ result: 'external task result' });
    const mockModuleResolver = jest.fn().mockResolvedValue(
      jest.fn().mockImplementation(() => ({
        handle: externalTaskHandler,
      })),
    );

    const handlerPath = path.resolve('tasks', 'externalTaskHandler.js');
    jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
      return filePath === handlerPath;
    });

    const input = {
      task: { taskDef: { handler: handlerPath } },
      session: { systemTasks: {} },
      context: {
        getLogger: jest.fn().mockReturnValue({ verbose: jest.fn() }),
        getConfigProvider: jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue('tasks') }),
      },
    } as unknown as TaskHandlerInput;

    const invoker = new DefaultTaskInvoker(mockModuleResolver);
    const result = await invoker.invoke(input);
    expect(result).toEqual({ result: 'external task result' });
    expect(externalTaskHandler).toHaveBeenCalledWith(input);
  });

  it('throws an error if the task handler is not found', async () => {
    const input = {
      task: { taskDef: { handler: 'nonExistentTask' } },
      session: { systemTasks: {} },
      context: {
        getLogger: jest.fn().mockReturnValue({ verbose: jest.fn() }),
        getConfigProvider: jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue('tasks') }),
      },
    } as unknown as TaskHandlerInput;

    const invoker = new DefaultTaskInvoker();
    await expect(invoker.invoke(input)).rejects.toThrow(InvalidParameterError);
  });

  it('returns null if the task handler file does not exist', () => {
    const invoker = new DefaultTaskInvoker();
    const location = invoker['resolveModuleLocation']('nonExistentTask', 'tasks');
    expect(location).toBeNull();
  });

  it('loads without errors', async () => {
    const invoker = new DefaultTaskInvoker();
    const context = {
      getLogger: jest.fn().mockReturnValue({ verbose: jest.fn(), debug: jest.fn() }),
      getConfigProvider: jest.fn(() => ({
        get changes$() {
          return new Subject<any>();
        },
      })),
    };
    await expect(invoker.load(context as any)).resolves.toBeUndefined();
  });

  it('unloads without errors', async () => {
    const invoker = new DefaultTaskInvoker();
    await expect(invoker.unload()).resolves.toBeUndefined();
  });

  it('resolves an absolute path', () => {
    const absolutePath = path.resolve('/absolute/path/to/module.js');
    expect(invoker['resolveModuleLocation'](absolutePath, customTasksDir)).toBe(absolutePath);
  });

  it('resolves a path from the current directory', () => {
    const currentDirPath = path.resolve(process.cwd(), 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    expect(invoker['resolveModuleLocation']('module.js', customTasksDir)).toBe(currentDirPath);
  });

  it('resolves a path from the runner directory', () => {
    const runnerDirPath = path.resolve(getEntryPointDir(), 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(invoker['resolveModuleLocation']('module.js', customTasksDir)).toBe(runnerDirPath);
  });

  it('resolves a path from the custom tasks directory', () => {
    const customTasksDirPath = path.resolve(customTasksDir, 'module.js');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(invoker['resolveModuleLocation']('module.js', customTasksDir)).toBe(customTasksDirPath);
  });

  it('resolves a path with .js extension from the custom tasks directory', () => {
    const customTasksDirPathWithJs = path.resolve(customTasksDir, 'module.js');
    jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    expect(invoker['resolveModuleLocation']('module', customTasksDir)).toBe(customTasksDirPathWithJs);
  });
});
