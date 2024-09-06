import { DefaultRunner } from '@src/runner/default-runner';
import { IdGenerator, POST_RUN_WORKFLOW_PLUGIN, PRE_RUN_WORKFLOW_PLUGIN, WorkflowRunner } from '@letrun/core';
import { AppContext, IllegalStateError, InvalidParameterError, Workflow, WorkflowDef } from '@letrun/common';
import { DefaultContext } from '@src/runner/default-context';
import { DefaultTasksFactory } from '@src/runner/default-tasks-factory';
import { SystemTaskManager } from '@src/system-task';
import { BootstrapUtils } from '@src/libs/bootstrap-utils';

const jest = import.meta.jest;

describe('DefaultRunner', () => {
  let runner: DefaultRunner;
  let mockContext: jest.Mocked<AppContext>;
  let mockWorkflowRunner: jest.Mocked<WorkflowRunner>;
  let mockIdGenerator: jest.Mocked<IdGenerator>;

  beforeEach(() => {
    mockWorkflowRunner = {
      execute: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<WorkflowRunner>;

    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue(mockWorkflowRunner),
        callPluginMethod: jest.fn(),
      }),
      unload: jest.fn(),
    } as unknown as jest.Mocked<AppContext>;
    mockIdGenerator = {
      getParentId: jest.fn(),
      generateId: jest.fn(),
    } as unknown as jest.Mocked<IdGenerator>;

    runner = new DefaultRunner();
  });

  it('loads context successfully if not provided', async () => {
    const loadSpy = jest.spyOn(DefaultContext.prototype, 'load');
    await runner.load();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('uses provided context', async () => {
    await runner.load(mockContext);
    expect(runner['context']).toBe(mockContext);
  });

  it('unloads context successfully if not external', async () => {
    await runner.load();
    const unloadSpy = jest.spyOn(DefaultContext.prototype, 'unload');
    await runner.unload();
    expect(unloadSpy).toHaveBeenCalled();
  });

  it('does not unload external context', async () => {
    await runner.load(mockContext);
    // const unloadSpy = jest.spyOn(DefaultContext.prototype, 'unload');
    await runner.unload();
    expect(mockContext.unload).not.toHaveBeenCalled();
  });

  it('throws error for invalid workflow definition', async () => {
    const invalidWorkflowDef = { name: '' } as WorkflowDef;
    await expect(runner.run(invalidWorkflowDef)).rejects.toThrow(InvalidParameterError);
  });

  it('throws error if plugin manager not found', async () => {
    await runner.load();
    runner['context'] = { getPluginManager: jest.fn().mockReturnValue(null) } as unknown as AppContext;
    await expect(runner.run({ name: 'workflow name', tasks: {} } as WorkflowDef)).rejects.toThrow(IllegalStateError);
  });

  it('executes workflow successfully', async () => {
    const workflowDef = { name: 'test', tasks: {} } as WorkflowDef;
    await runner.load(mockContext);
    const result = await runner.run(workflowDef);
    expect(result?.status).toBe('completed');
  });

  it('handles workflow execution error', async () => {
    const workflowDef = { name: 'test', tasks: {} } as WorkflowDef;
    mockWorkflowRunner.execute.mockRejectedValueOnce(new Error('Execution error'));
    await runner.load(mockContext);
    const result = await runner.run(workflowDef);
    expect(result?.status).toBe('error');
    expect(result?.errorMessage).toBe('Execution error');
  });

  it('prepares workflow with input', async () => {
    const workflowDef = { name: 'test', tasks: {} } as WorkflowDef;
    const input = { key: 'value' };
    const preparedWorkflow = runner['prepareWorkflow'](
      workflowDef,
      new DefaultTasksFactory(mockIdGenerator, SystemTaskManager.getTaskDefValidator),
      input,
    );
    expect(preparedWorkflow.input).toBe(input);
  });

  it('fires pre and post workflow run events', async () => {
    const workflow = { id: '1', name: 'test', tasks: {}, status: 'open' } as Workflow;
    const fireEventSpy = jest.spyOn(runner as any, 'firePreOrPostWorkflowRun');
    await runner.load(mockContext);
    await runner.run(workflow);
    expect(fireEventSpy).toHaveBeenCalledWith(expect.objectContaining({ event: PRE_RUN_WORKFLOW_PLUGIN }));
    expect(fireEventSpy).toHaveBeenCalledWith(expect.objectContaining({ event: POST_RUN_WORKFLOW_PLUGIN }));
  });
});

describe('DefaultRunner.create', () => {
  let mockContext: jest.Mocked<AppContext>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      }),
      getConfigProvider: jest.fn(() => ({
        set: jest.fn(),
      })),
      getPluginManager: jest.fn(),
      unload: jest.fn(),
      load: jest.fn(),
    } as unknown as jest.Mocked<AppContext>;
  });

  it('initializes a DefaultRunner instance correctly', async () => {
    const runner = await DefaultRunner.create();
    expect(runner).toBeInstanceOf(DefaultRunner);
  });

  it('sets the context and log level correctly', async () => {
    const setGlobalLogLevelSpy = jest.spyOn(BootstrapUtils, 'setGlobalLogLevel');
    const runner = (await DefaultRunner.create(mockContext, 'debug')) as any;
    expect(runner['context']).toBe(mockContext);
    expect(setGlobalLogLevelSpy).toHaveBeenCalledWith(mockContext, 'debug');
  });

  it('handles the absence of a context correctly', async () => {
    const loadSpy = jest.spyOn(DefaultContext.prototype, 'load');
    const runner = (await DefaultRunner.create()) as any;
    expect(runner['context']).toBeInstanceOf(DefaultContext);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should not call context.load if context is provided', async () => {
    const loadSpy = jest.spyOn(mockContext, 'load');
    const runner = await DefaultRunner.create(mockContext);
    expect(loadSpy).not.toHaveBeenCalled();
    expect((runner as any)['isExternalContext']).toBeTruthy();
  });

  it('should initialize a new context if no context is provided', async () => {
    const loadSpy = jest.spyOn(DefaultContext.prototype, 'load');
    const runner = (await DefaultRunner.create()) as any;
    expect(runner['context']).toBeInstanceOf(DefaultContext);
    expect(loadSpy).toHaveBeenCalled();
    expect((runner as any)['isExternalContext']).toBeFalsy();
  });
});

describe('DefaultRunner.abort', () => {
  let runner: DefaultRunner;
  let mockContext: jest.Mocked<AppContext>;

  beforeEach(() => {
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      }),
      getPluginManager: jest.fn(),
      unload: jest.fn(),
    } as unknown as jest.Mocked<AppContext>;

    runner = new DefaultRunner();
  });

  it('sets the abortController signal to aborted', async () => {
    await runner.load(mockContext);
    runner['abortController'] = new AbortController();
    const abortSpy = jest.spyOn(runner['abortController'], 'abort');
    runner.abort();
    expect(abortSpy).toHaveBeenCalled();
  });

  it('does not throw an error if abortController is not set', () => {
    expect(() => runner.abort()).not.toThrow();
  });

  it('aborts the workflow while running', async () => {
    const mockWorkflowRunner = {
      execute: jest.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000))),
    } as unknown as jest.Mocked<WorkflowRunner>;

    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue(mockWorkflowRunner),
        callPluginMethod: jest.fn(),
      }),
      unload: jest.fn(),
    } as unknown as jest.Mocked<AppContext>;

    runner = new DefaultRunner();

    const workflowDef = { name: 'test', tasks: {} } as WorkflowDef;
    await runner.load(mockContext);
    const runPromise = runner.run(workflowDef);
    runner.abort();
    const result = await runPromise;
    expect(result?.status).toBe('cancelled');
  });
});
