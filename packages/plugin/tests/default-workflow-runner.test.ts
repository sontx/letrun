import DefaultWorkflowRunner from '@src/default-workflow-runner';
import {
  AppContext,
  ExecutionSession,
  IllegalStateError,
  InterruptInvokeError,
  RerunError,
  RETRY_PLUGIN, RetryConfig,
  Task,
  TASK_INVOKER_PLUGIN,
  Workflow,
  WorkflowRunner,
  WorkflowRunnerInput,
} from '@letrun/core';
import { Subject } from 'rxjs';

const jest = import.meta.jest;

describe('DefaultWorkflowRunner', () => {
  let abortController: AbortController;
  let pluginManagerGetOneMock: jest.Mock;

  beforeEach(() => {
    pluginManagerGetOneMock = jest.fn((type) => {
      if (type === RETRY_PLUGIN) {
        return {
          retry: jest.fn((input) => input.doJob()),
        };
      }
      throw new Error(`Plugin type ${type} not found`);
    });
    abortController = new AbortController();
  });

  it('loads context and logger correctly', async () => {
    const context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      })),
      getConfigProvider: jest.fn().mockReturnValue({
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;
    const runner = new DefaultWorkflowRunner();
    await runner.load(context);
    expect(runner['context']).toBe(context);
  });

  it('throws error if context is not loaded', () => {
    const runner = new DefaultWorkflowRunner();
    expect(() => runner['getContext']()).toThrow(IllegalStateError);
  });

  it('executes workflow and returns result', async () => {
    const workflow = {} as Workflow;
    const input = { workflow, session: {} } as WorkflowRunnerInput;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    const preWorkflowRunSpy = jest.spyOn(runner, 'preWorkflowRun').mockResolvedValue(undefined);
    jest.spyOn(runner, 'runWorkflow').mockResolvedValue('result');
    const result = await runner.execute(input);
    expect(result).toBe('result');
    expect(preWorkflowRunSpy).toHaveBeenCalledTimes(1);
  });

  it('throws error if runner is unloaded during execution', async () => {
    const workflow = {} as Workflow;
    const input = { workflow, session: {} } as WorkflowRunnerInput;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    runner['unloaded'] = true;
    jest.spyOn(runner, 'preWorkflowRun').mockResolvedValue(undefined);
    await expect(runner.execute(input)).rejects.toThrow(InterruptInvokeError);
  });

  it('completes task and sets status to completed', async () => {
    const task = { status: 'executing', timeStarted: Date.now() } as Task;
    const context = {
      getLogger: jest.fn().mockReturnValue({ verbose: jest.fn() }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: pluginManagerGetOneMock,
        callPluginMethod: jest.fn().mockResolvedValue({}),
      }),
    } as unknown as AppContext;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'completeTask').mockImplementation((task: any) => {
      task.status = 'completed';
    });
    jest.spyOn(runner, 'getContext').mockReturnValue(context);
    await runner['executeTask']({ task, workflow: {}, context, session: {} } as any);
    expect(task.status).toBe('completed');
  });

  it('handles task error and sets status to error', async () => {
    const task = { status: 'executing', timeStarted: Date.now(), taskDef: {}, output: 'initial output' } as Task;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    const error = new Error('Error executing task');
    jest.spyOn(runner, 'getContext').mockReturnValue({
      getPluginManager: jest.fn().mockReturnValue({
        getOne: pluginManagerGetOneMock,
        callPluginMethod: jest.fn().mockImplementation((plugin, method) => {
          if (plugin === TASK_INVOKER_PLUGIN && method === 'invoke') {
            throw error;
          }
          return {};
        }),
      }),
    });

    await expect(
      runner['executeTask']({
        task,
        workflow: {},
        context: {},
        session: {
          getParentTask: jest.fn().mockReturnValue(undefined),
        },
      } as any),
    ).rejects.toThrow(error.message);

    expect(task.status).toBe('error');
    expect(task.errorMessage).toBe(error.message);
    expect(task.error).toBe(error);
    expect(task.output).toBe('initial output');
  });

  it('keeps task status as open if RerunError is thrown', async () => {
    const task = { status: 'waiting', timeStarted: Date.now() } as Task;
    const context = {
      getLogger: jest.fn().mockReturnValue({ verbose: jest.fn(), info: jest.fn(), error: jest.fn() }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: pluginManagerGetOneMock,
        callPluginMethod: jest.fn().mockImplementation((plugin, method) => {
          if (plugin === TASK_INVOKER_PLUGIN && method === 'invoke') {
            throw new RerunError();
          }
        }),
      }),
    } as unknown as AppContext;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);

    await runner['executeTask']({ task, workflow: {}, context, session: {} } as any);
    expect(task.status).toBe('open');
  });

  it('handles error and cancels only open and waiting children tasks if parent task is a catch task', async () => {
    const error = new Error('Error executing task');
    const task = { status: 'executing', timeStarted: Date.now(), taskDef: {}, runtimeName: 'task1' } as Task;
    const catchTask = {
      status: 'executing',
      taskDef: { handler: 'catch' },
      tasks: {
        task1: task,
        task2: { status: 'open', runtimeName: 'task2' } as Task,
        task3: { status: 'waiting', runtimeName: 'task3' } as Task,
        task4: { status: 'completed', runtimeName: 'task4' } as Task,
        task5: { status: 'error', runtimeName: 'task5' } as Task,
      },
    } as unknown as Task;
    const context = {
      getLogger: jest.fn().mockReturnValue({ verbose: jest.fn(), info: jest.fn(), error: jest.fn() }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: pluginManagerGetOneMock,
        callPluginMethod: jest.fn().mockImplementation((plugin, method) => {
          if (plugin === TASK_INVOKER_PLUGIN && method === 'invoke') {
            throw error;
          }
        }),
      }),
    } as unknown as AppContext;
    const session = {
      getParentTask: jest.fn(checkTask => checkTask !== catchTask ? catchTask : undefined),
    } as unknown as ExecutionSession;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);

    await runner['executeTask']({ task, workflow: {}, context, session } as any);

    expect(task.status).toBe('error');
    expect(task.errorMessage).toBe('Error executing task');
    expect(task.error).toBe(error);
    expect((catchTask.tasks!['task2'] as any).status).toBe('cancelled');
    expect((catchTask.tasks!['task3'] as any).status).toBe('cancelled');
    expect((catchTask.tasks!['task4'] as any).status).toBe('completed');
    expect((catchTask.tasks!['task5'] as any).status).toBe('error');
  });

  it('ignores error and completes task if taskDef.ignoreError is true', async () => {
    const task = { status: 'executing', timeStarted: Date.now(), taskDef: { ignoreError: true } } as Task;
    const context = {
      getLogger: jest.fn().mockReturnValue({ verbose: jest.fn(), warn: jest.fn(), info: jest.fn(), error: jest.fn() }),
      getPluginManager: jest.fn().mockReturnValue({
        callPluginMethod: jest.fn().mockImplementation((plugin, method) => {
          if (plugin === TASK_INVOKER_PLUGIN && method === 'invoke') {
            throw new Error('Error executing task');
          }
        }),
      }),
    } as unknown as AppContext;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);
    jest.spyOn(runner, 'completeTask').mockImplementation((task: any) => {
      task.status = 'completed';
    });

    await runner['executeTask']({ task, workflow: {}, context, session: {} } as any);
    expect(task.status).toBe('completed');
  });

  it('fires pre and post task run events for each task even if there is an error', async () => {
    const task = { status: 'executing', timeStarted: Date.now(), taskDef: {}, runtimeName: 'task1' } as Task;
    const context = {
      getLogger: jest.fn().mockReturnValue({ verbose: jest.fn(), info: jest.fn(), error: jest.fn() }),
      getPluginManager: jest.fn().mockReturnValue({
        callPluginMethod: jest.fn().mockImplementation((plugin, method) => {
          if (plugin === TASK_INVOKER_PLUGIN && method === 'invoke') {
            throw new Error('Error executing task');
          }
        }),
      }),
    } as unknown as AppContext;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);
    const preTaskRunSpy = jest.spyOn(runner as any, 'preTaskRun');
    const postTaskRunSpy = jest.spyOn(runner as any, 'postTaskRun');

    try {
      await runner['executeTask']({
        task,
        workflow: {},
        context,
        session: {
          getParentTask: jest.fn().mockReturnValue(undefined),
        },
      } as any);
    } catch (e) {
      // Ignore the error
    }

    expect(preTaskRunSpy).toHaveBeenCalledTimes(1);
    expect(postTaskRunSpy).toHaveBeenCalledTimes(1);
  });

  it('opens next available task and returns true if tasks are open', () => {
    const workflow = { tasks: { task1: { status: 'waiting' } } } as unknown as Workflow;
    const runner = new DefaultWorkflowRunner();
    const result = runner['openNextAvailableTask'](workflow);
    expect(result).toBe(true);
  });

  it('returns false if no tasks are open', () => {
    const workflow = { tasks: { task1: { status: 'completed' } } } as unknown as Workflow;
    const runner = new DefaultWorkflowRunner();
    const result = runner['openNextAvailableTask'](workflow);
    expect(result).toBe(false);
  });

  it('processes tasks in sequence correctly in runWorkflow method', async () => {
    const task1 = { status: 'open', blocking: true, runtimeName: 'task1', taskDef: {} } as Task;
    const task2 = { status: 'waiting', blocking: true, runtimeName: 'task2', taskDef: {} } as Task;
    const task3 = { status: 'waiting', blocking: true, runtimeName: 'task3', taskDef: {} } as Task;
    const workflow = { tasks: { task1, task2, task3 } } as unknown as Workflow;
    const context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        verbose: jest.fn(),
      })),
      getPluginManager: jest.fn().mockReturnValue({
        callPluginMethod: jest.fn().mockResolvedValue({}),
      }),
      getConfigProvider: jest.fn().mockReturnValue({
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;
    const session = {
      resolveParameter: jest.fn().mockResolvedValue({}),
      signal: abortController.signal,
    } as unknown as ExecutionSession;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);
    jest.spyOn(runner as any, 'preWorkflowRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'postTaskRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'preTaskRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'executeTask').mockImplementation(async (input: any) => {
      input.task.status = 'completed';
      return {};
    });

    const executionOrder: string[] = [];
    jest.spyOn(runner as any, 'executeTask').mockImplementation(async (input: any) => {
      executionOrder.push(input.task.runtimeName);
      input.task.status = 'completed';
      return {};
    });

    await runner.load(context);
    await runner['runWorkflow']({ workflow, context, session } as any);

    expect(task1.status).toBe('completed');
    expect(task2.status).toBe('completed');
    expect(task3.status).toBe('completed');
    expect(executionOrder).toEqual(['task1', 'task2', 'task3']);
  });

  it('processes tasks in concurrent correctly in runWorkflow method', async () => {
    const task1 = { status: 'open', runtimeName: 'task1', taskDef: {} } as Task;
    const task2 = { status: 'waiting', runtimeName: 'task2', taskDef: {} } as Task;
    const task3 = { status: 'completed', runtimeName: 'task3', taskDef: {} } as Task;
    const workflow = { tasks: { task1, task2, task3 } } as unknown as Workflow;
    const context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        verbose: jest.fn(),
      })),
      getPluginManager: jest.fn().mockReturnValue({
        callPluginMethod: jest.fn().mockResolvedValue({}),
      }),
      getConfigProvider: jest.fn().mockReturnValue({
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;
    const session = {
      resolveParameter: jest.fn().mockResolvedValue({}),
      signal: abortController.signal,
    } as unknown as ExecutionSession;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);
    jest.spyOn(runner as any, 'preWorkflowRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'postTaskRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'preTaskRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'executeTask').mockImplementation(async (input: any) => {
      input.task.status = 'completed';
      return {};
    });

    await runner.load(context);
    await runner['runWorkflow']({ workflow, context, session } as any);

    expect(task1.status).toBe('completed');
    expect(task2.status).toBe('completed');
    expect(task3.status).toBe('completed');
  });

  it('processes nested tasks in concurrent correctly in runWorkflow method', async () => {
    const task1 = { status: 'open', runtimeName: 'task1', taskDef: {}, tasks: {} } as Task;
    const task2 = { status: 'waiting', runtimeName: 'task2', taskDef: {}, tasks: {} } as Task;
    const task3 = { status: 'completed', runtimeName: 'task3', taskDef: {}, tasks: {} } as Task;
    const nestedTask1 = { status: 'open', runtimeName: 'nestedTask1', taskDef: {} } as Task;
    const nestedTask2 = { status: 'waiting', runtimeName: 'nestedTask2', taskDef: {} } as Task;
    task1.tasks = { nestedTask1, nestedTask2 };
    const workflow = { tasks: { task1, task2, task3 } } as unknown as Workflow;
    const context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        verbose: jest.fn(),
      })),
      getPluginManager: jest.fn().mockReturnValue({
        callPluginMethod: jest.fn().mockResolvedValue({}),
      }),
      getConfigProvider: jest.fn().mockReturnValue({
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;
    const session = {
      resolveParameter: jest.fn().mockResolvedValue({}),
      signal: abortController.signal,
    } as unknown as ExecutionSession;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);
    jest.spyOn(runner as any, 'preWorkflowRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'postTaskRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'preTaskRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'executeTask').mockImplementation(async (input: any) => {
      input.task.status = 'completed';
      return {};
    });

    await runner.load(context);
    await runner['runWorkflow']({ workflow, context, session } as any);

    expect(task1.status).toBe('completed');
    expect(task2.status).toBe('completed');
    expect(task3.status).toBe('completed');
    expect(nestedTask1.status).toBe('completed');
    expect(nestedTask2.status).toBe('completed');
  });

  it('processes nested tasks in sequence correctly in runWorkflow method', async () => {
    const nestedTask1 = { status: 'waiting', blocking: true, runtimeName: 'nestedTask1', taskDef: {} } as Task;
    const nestedTask2 = { status: 'waiting', blocking: true, runtimeName: 'nestedTask2', taskDef: {} } as Task;
    const task1 = {
      status: 'waiting',
      blocking: true,
      runtimeName: 'task1',
      taskDef: {},
      tasks: { nestedTask1, nestedTask2 },
    } as unknown as Task;
    const task2 = {
      status: 'waiting',
      blocking: true,
      runtimeName: 'task2',
      taskDef: {},
      tasks: [],
    } as unknown as Task;
    const task3 = {
      status: 'waiting',
      blocking: true,
      runtimeName: 'task3',
      taskDef: {},
      tasks: [],
    } as unknown as Task;
    const workflow = { tasks: { task1, task2, task3 } } as unknown as Workflow;
    const context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        verbose: jest.fn(),
      })),
      getPluginManager: jest.fn().mockReturnValue({
        callPluginMethod: jest.fn().mockResolvedValue({}),
      }),
      getConfigProvider: jest.fn().mockReturnValue({
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;
    const session = {
      resolveParameter: jest.fn().mockResolvedValue({}),
      signal: abortController.signal,
    } as unknown as ExecutionSession;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);
    jest.spyOn(runner as any, 'preWorkflowRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'postTaskRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'preTaskRun').mockResolvedValue(undefined);

    const executionOrder: string[] = [];
    jest.spyOn(runner as any, 'executeTask').mockImplementation(async (input: any) => {
      executionOrder.push(input.task.runtimeName);
      input.task.status = 'completed';
      return {};
    });

    await runner.load(context);
    await runner['runWorkflow']({ workflow, context, session } as any);

    expect(task1.status).toBe('completed');
    expect(task2.status).toBe('completed');
    expect(task3.status).toBe('completed');
    expect(nestedTask1.status).toBe('completed');
    expect(nestedTask2.status).toBe('completed');
    expect(executionOrder).toEqual(['nestedTask1', 'nestedTask2', 'task1', 'task2', 'task3']);
  });

  it('handles error in concurrent correctly in runWorkflow method', async () => {
    const task1 = { status: 'open', runtimeName: 'task1', taskDef: {} } as Task;
    const task2 = { status: 'waiting', runtimeName: 'task2', taskDef: {} } as Task;
    const task3 = { status: 'completed', runtimeName: 'task3', taskDef: {} } as Task;
    const workflow = { tasks: { task1, task2, task3 } } as unknown as Workflow;
    const context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        verbose: jest.fn(),
      })),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: pluginManagerGetOneMock,
        callPluginMethod: jest.fn().mockImplementation((plugin, method, input) => {
          if (plugin === TASK_INVOKER_PLUGIN && method === 'invoke' && input.task.runtimeName === 'task1') {
            throw new Error('Error executing task');
          }
        }),
      }),
      getConfigProvider: jest.fn().mockReturnValue({
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;
    const session = {
      resolveParameter: jest.fn().mockResolvedValue({}),
      signal: abortController.signal,
      getParentTask: jest.fn().mockReturnValue(undefined),
    } as unknown as ExecutionSession;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);
    jest.spyOn(runner as any, 'preWorkflowRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'postTaskRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'preTaskRun').mockResolvedValue(undefined);

    try {
      await runner.load(context);
      await runner['runWorkflow']({ workflow, context, session } as any);
    } catch (e) {
      // Handle the error
    }

    expect(task1.status).toBe('error');
    expect(task2.status).toBe('completed');
    expect(task3.status).toBe('completed');
  });

  it('handles error in sequence correctly in runWorkflow method', async () => {
    const task1 = { status: 'open', blocking: true, runtimeName: 'task1', taskDef: {} } as Task;
    const task2 = { status: 'waiting', blocking: true, runtimeName: 'task2', taskDef: {} } as Task;
    const task3 = { status: 'completed', blocking: true, runtimeName: 'task3', taskDef: {} } as Task;
    const workflow = { tasks: { task1, task2, task3 } } as unknown as Workflow;
    const context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        verbose: jest.fn(),
      })),
      getPluginManager: jest.fn().mockReturnValue({
        callPluginMethod: jest.fn().mockImplementation((plugin, method, input) => {
          if (plugin === TASK_INVOKER_PLUGIN && method === 'invoke' && input.task.runtimeName === 'task1') {
            throw new Error('Error executing task');
          }
        }),
      }),
      getConfigProvider: jest.fn().mockReturnValue({
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;
    const session = {
      resolveParameter: jest.fn().mockResolvedValue({}),
      signal: abortController.signal,
    } as unknown as ExecutionSession;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);
    jest.spyOn(runner as any, 'preWorkflowRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'postTaskRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'preTaskRun').mockResolvedValue(undefined);

    try {
      await runner.load(context);
      await runner['runWorkflow']({ workflow, context, session } as any);
    } catch (e) {
      // Handle the error
    }

    expect(task1.status).toBe('error');
    expect(task2.status).toBe('waiting');
    expect(task3.status).toBe('completed');
  });

  it('re-executes children tasks if RerunError occurs on nested tasks in runWorkflow method', async () => {
    const nestedTask1 = { status: 'waiting', blocking: true, runtimeName: 'nestedTask1', taskDef: {} } as Task;
    const nestedTask2 = { status: 'waiting', blocking: true, runtimeName: 'nestedTask2', taskDef: {} } as Task;
    const task1 = {
      status: 'waiting',
      runtimeName: 'task1',
      blocking: true,
      taskDef: {},
      tasks: { nestedTask1, nestedTask2 },
    } as unknown as Task;
    const task2 = { status: 'waiting', blocking: true, runtimeName: 'task2', taskDef: {} } as Task;
    const workflow = { tasks: { task1, task2 } } as unknown as Workflow;
    let fireRerunError = false;
    const context = {
      getLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        verbose: jest.fn(),
      })),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: pluginManagerGetOneMock,
        callPluginMethod: jest.fn().mockImplementation((_, __, input) => {
          if (input.task.runtimeName === 'nestedTask1' && !fireRerunError) {
            fireRerunError = true;
            throw new RerunError('Rerun nestedTask1');
          }
          return {};
        }),
      }),
      getConfigProvider: jest.fn().mockReturnValue({
        get changes$() {
          return new Subject<any>();
        },
      }),
    } as unknown as AppContext;
    const session = {
      resolveParameter: jest.fn().mockResolvedValue({}),
      signal: abortController.signal,
      getParentTask: jest.fn().mockReturnValue(undefined),
    } as unknown as ExecutionSession;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    jest.spyOn(runner, 'getContext').mockReturnValue(context);
    jest.spyOn(runner as any, 'preWorkflowRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'postTaskRun').mockResolvedValue(undefined);
    jest.spyOn(runner as any, 'preTaskRun').mockResolvedValue(undefined);

    const executionOrder: string[] = [];
    const originalExecuteTask = runner['executeTask'].bind(runner);
    jest.spyOn(runner as any, 'executeTask').mockImplementation(async (input: any) => {
      executionOrder.push(input.task.runtimeName);
      return originalExecuteTask(input);
    });

    await runner.load(context);
    await runner['runWorkflow']({ workflow, context, session } as any);

    expect(task1.status).toBe('completed');
    expect(task2.status).toBe('completed');
    expect(nestedTask1.status).toBe('completed');
    expect(nestedTask2.status).toBe('completed');
    expect(executionOrder).toEqual(['nestedTask1', 'nestedTask1', 'nestedTask2', 'task1', 'task2']);
  });

  it('returns correct retry configuration for a task', () => {
    const task = {
      taskDef: {
        retryCount: 3,
        retryDelaySeconds: 2,
        retryStrategy: 'exponential_backoff',
      },
    } as Task;

    const session = {
      getParameter: jest.fn().mockReturnValue(undefined),
    } as unknown as ExecutionSession;

    const expectedConfig: RetryConfig = {
      retryCount: 3,
      retryDelaySeconds: 2,
      retryStrategy: 'exponential_backoff',
    };

    const runner = new DefaultWorkflowRunner();
    const config = runner['lookupRetryConfig'](task, session, {} as any);

    expect(config).toEqual(expectedConfig);
  });

  it('should lookup retry config from parent task', () => {
    const childTask = { taskDef: { retryCount: undefined } } as Task;
    const parentTask = { taskDef: { retryCount: 3 } } as Task;
    const session = {
      getParentTask: jest.fn((task) => (task === childTask ? parentTask : undefined)),
    } as unknown as ExecutionSession;

    const runner = new DefaultWorkflowRunner() as WorkflowRunner;
    const retryConfig = runner['lookupRetryConfig'](childTask, session, {} as any);

    expect(retryConfig.retryCount).toBe(3);
  });

  it('should lookup retry config from workflow if task and parent task do not have config', () => {
    const childTask = { taskDef: { retryCount: undefined } } as Task;
    const parentTask = { taskDef: { retryCount: undefined } } as Task;
    const workflow = { retryCount: 5 } as Workflow;
    const session = {
      getParentTask: jest.fn((task) => (task === childTask ? parentTask : undefined)),
    } as unknown as ExecutionSession;
    const runner = new DefaultWorkflowRunner() as WorkflowRunner;

    const retryConfig = runner['lookupRetryConfig'](childTask, session, workflow);

    expect(retryConfig.retryCount).toBe(5);
  });
});
