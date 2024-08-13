import { DefaultRunner } from '@src/runner/default-runner';
import {
  AppContext,
  IllegalStateError,
  InvalidParameterError,
  Workflow,
  WorkflowDef,
  WorkflowRunner,
} from '@letrun/core';
import { DefaultContext } from '@src/runner/default-context';
import { DefaultTasksFactory } from '@src/runner/default-tasks-factory';
import { SystemTaskManager } from '@src/system-task';

const jest = import.meta.jest;

describe('DefaultRunner', () => {
  let runner: DefaultRunner;
  let mockContext: jest.Mocked<AppContext>;
  let mockWorkflowRunner: jest.Mocked<WorkflowRunner>;

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
      new DefaultTasksFactory(SystemTaskManager.getTaskDefValidator),
      input,
    );
    expect(preparedWorkflow.input).toBe(input);
  });

  it('fires pre and post workflow run events', async () => {
    const workflow = { id: '1', name: 'test', tasks: {}, status: 'open' } as Workflow;
    const fireEventSpy = jest.spyOn(runner as any, 'firePreOrPostWorkflowRun');
    await runner.load(mockContext);
    await runner.run(workflow);
    expect(fireEventSpy).toHaveBeenCalledWith(expect.objectContaining({ event: 'pre-workflow-run' }));
    expect(fireEventSpy).toHaveBeenCalledWith(expect.objectContaining({ event: 'post-workflow-run' }));
  });
});
