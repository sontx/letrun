import DefaultTaskInvoker from '@src/default-task-invoker';
import { InvalidParameterError, TaskHandlerInput } from '@letrun/common';
import { Subject } from 'rxjs';

const jest = import.meta.jest;

describe('DefaultTaskInvoker', () => {
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
    const mockTaskGroupResolver = jest.fn().mockReturnValue({
      name: '',
      tasks: {
        mockTask: {
          handle: externalTaskHandler,
        },
      },
    });

    const input = {
      task: { taskDef: { handler: 'script:/path/to/script.js:mockTask' } },
      session: { systemTasks: {} },
      context: {
        getLogger: jest.fn().mockReturnValue({ verbose: jest.fn() }),
        getConfigProvider: jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue('tasks') }),
        getPluginManager: jest.fn().mockImplementation(() => ({
          callPluginMethod: jest.fn().mockResolvedValue('/path/to/script.js'),
        })),
      },
    } as unknown as TaskHandlerInput;

    const invoker = new DefaultTaskInvoker(mockTaskGroupResolver);
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
        getPluginManager: jest.fn().mockImplementation(() => ({
          callPluginMethod: jest.fn().mockResolvedValue(undefined),
        })),
      },
    } as unknown as TaskHandlerInput;

    const invoker = new DefaultTaskInvoker();
    await expect(invoker.invoke(input)).rejects.toThrow(InvalidParameterError);
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
});
