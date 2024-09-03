import { DefaultExecutionSession } from '@src/runner/default-execution-session';
import { IdGenerator } from '@letrun/core';
import { AppContext, IllegalStateError, Runner, Task, TaskHandler, TasksFactory, Workflow } from '@letrun/common';

const jest = import.meta.jest;

describe('DefaultExecutionSession', () => {
  let session: DefaultExecutionSession;
  let mockContext: jest.Mocked<AppContext>;
  let mockTasksFactory: jest.Mocked<TasksFactory>;
  let mockRunner: jest.Mocked<Runner>;
  let mockSystemTasks: Record<string, jest.Mocked<TaskHandler>>;
  let mockWorkflow: jest.Mocked<Workflow>;
  let mockIdGenerator: jest.Mocked<IdGenerator>;
  let abortController: AbortController;

  beforeEach(() => {
    abortController = new AbortController();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        warn: jest.fn(),
      }),
      getConfigProvider: jest.fn().mockReturnValue({
        getInt: jest.fn().mockResolvedValue(10),
      }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue({
          interpolate: jest.fn().mockImplementation((value) => value),
        }),
      }),
    } as unknown as jest.Mocked<AppContext>;

    mockTasksFactory = {} as unknown as jest.Mocked<TasksFactory>;
    mockRunner = {} as unknown as jest.Mocked<Runner>;
    mockSystemTasks = {};
    mockWorkflow = {
      tasks: {},
    } as unknown as jest.Mocked<Workflow>;
    mockIdGenerator = {
      getParentId: jest.fn(),
    } as unknown as jest.Mocked<IdGenerator>;

    session = new DefaultExecutionSession(
      mockWorkflow,
      mockTasksFactory,
      mockRunner,
      mockSystemTasks,
      abortController.signal,
      mockContext,
      mockIdGenerator,
    );
  });

  it('resolves string parameter successfully', async () => {
    const result = await session.resolveParameter('test');
    expect(result).toBe('test');
  });

  it('resolves object parameter successfully', async () => {
    const parameter = { key: 'value' };
    const result = await session.resolveParameter(parameter);
    expect(result).toEqual(parameter);
  });

  it('resolves array parameter successfully', async () => {
    const parameter = ['value1', 'value2'];
    const result = await session.resolveParameter(parameter);
    expect(result).toEqual(parameter);
  });

  it('resolves expression parameter successfully', async () => {
    const parameter = '${workflow.variables.test}';
    const interpolatedValue = 'resolvedValue';
    (mockContext.getPluginManager().getOne as jest.Mocked<any>).mockResolvedValueOnce({
      interpolate: jest.fn().mockResolvedValue(interpolatedValue),
    });

    const result = await session.resolveParameter(parameter);
    expect(result).toBe(interpolatedValue);
  });

  it('resolves nested expression in object successfully', async () => {
    const parameter = {
      level1: {
        level2: '${workflow.variables.test}',
      },
    };
    const interpolatedValue = 'resolvedValue';
    (mockContext.getPluginManager().getOne as jest.Mocked<any>).mockResolvedValueOnce({
      interpolate: jest.fn().mockResolvedValue(interpolatedValue),
    });

    const result = await session.resolveParameter(parameter);
    expect(result).toEqual({
      level1: {
        level2: interpolatedValue,
      },
    });
  });

  it('resolves nested expression in array successfully', async () => {
    const parameter = ['${workflow.variables.test}', ['${workflow.variables.test2}']];
    const interpolatedValue1 = 'resolvedValue1';
    const interpolatedValue2 = 'resolvedValue2';
    (mockContext.getPluginManager().getOne as jest.Mocked<any>).mockResolvedValueOnce({
      interpolate: jest.fn().mockImplementation((value) => {
        if (value === '${workflow.variables.test}') return interpolatedValue1;
        if (value === '${workflow.variables.test2}') return interpolatedValue2;
        return value;
      }),
    });

    const result = await session.resolveParameter(parameter);
    expect(result).toEqual([interpolatedValue1, [interpolatedValue2]]);
  });

  it('throws error if property resolver is not found', async () => {
    (mockContext.getPluginManager().getOne as jest.Mocked<any>).mockResolvedValueOnce(null);
    await expect(session.resolveParameter('test')).rejects.toThrow(IllegalStateError);
  });

  it('warns if max recursion level is reached', async () => {
    const parameter = 'test';
    await session.resolveParameter(parameter, undefined, 11);
    expect(mockContext.getLogger().warn).toHaveBeenCalledWith(
      `Max 11 recursion level reached for parameter: ${parameter}`,
    );
  });

  it('gets parent task successfully', () => {
    const parentTask = { id: 'parent' } as Task;
    const childTask = { id: 'parent/child' } as Task;
    session['registeredTasks'].set(parentTask.id, parentTask);
    session['registeredTasks'].set(childTask.id, childTask);
    mockIdGenerator.getParentId.mockReturnValueOnce('parent');
    const result = session.getParentTask(childTask);
    expect(result).toBe(parentTask);
  });

  it('returns undefined if parent task is not found', () => {
    const childTask = { id: 'parent.child' } as Task;
    const result = session.getParentTask(childTask);
    expect(result).toBeUndefined();
  });

  it('sets tasks successfully', () => {
    const parentTask = { id: 'parent', tasks: {} } as Task;
    const tasks = { task1: { id: 'task1' } as Task };
    session.setTasks(parentTask, tasks);
    expect(parentTask.tasks).toEqual(tasks);
  });

  it('clears tasks successfully', () => {
    const parentTask = { id: 'parent', tasks: { task1: { id: 'task1' } as Task } } as unknown as Task;
    session.clearTasks(parentTask);
    expect(parentTask.tasks).toEqual({});
  });
});
