import { RunWorkflowTaskHandler } from '@src/system-task/run-workflow';
import { InvalidParameterError, Task, TaskHandlerInput } from '@letrun/common';
import fs from 'fs';

const jest = import.meta.jest;

describe('RunWorkflowTaskHandler', () => {
  let handler: RunWorkflowTaskHandler;
  let mockContext: jest.Mocked<any>;
  let mockSession: jest.Mocked<any>;
  let mockTask: jest.Mocked<Task>;
  let abortController: AbortController;

  beforeEach(() => {
    abortController = new AbortController();
    handler = new RunWorkflowTaskHandler();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
      }),
    };
    mockSession = {
      runner: {
        run: jest.fn(),
      },
      signal: abortController.signal,
    };
    mockTask = {
      parameters: {},
    } as unknown as jest.Mocked<Task>;
  });

  it('runs workflow from parameters successfully', async () => {
    mockTask.parameters = { workflow: { name: 'testWorkflow' }, input: { key: 'value' } };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    mockSession.runner.run.mockResolvedValue({
      status: 'completed',
      name: 'testWorkflow',
      output: { result: 'success' },
    });
    const result = await handler.handle(input);
    expect(result).toEqual({ result: 'success' });
    expect(mockContext.getLogger().info).toHaveBeenCalledWith('Running workflow: testWorkflow');
    expect(mockContext.getLogger().info).toHaveBeenCalledWith('Workflow testWorkflow completed successfully');
  });

  it('runs workflow from file successfully', async () => {
    mockTask.parameters = { file: 'path/to/workflow.json', input: { key: 'value' } };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(JSON.stringify({ name: 'testWorkflow' }));
    mockSession.runner.run.mockResolvedValue({
      status: 'completed',
      name: 'testWorkflow',
      output: { result: 'success' },
    });
    const result = await handler.handle(input);
    expect(result).toEqual({ result: 'success' });
    expect(mockContext.getLogger().info).toHaveBeenCalledWith('Running workflow: testWorkflow');
    expect(mockContext.getLogger().info).toHaveBeenCalledWith('Workflow testWorkflow completed successfully');
  });

  it('throws error when workflow fails to run', async () => {
    mockTask.parameters = { workflow: { name: 'testWorkflow' }, input: { key: 'value' } };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    mockSession.runner.run.mockResolvedValue({
      status: 'failed',
      name: 'testWorkflow',
      errorMessage: 'Error occurred',
    });
    await expect(handler.handle(input)).rejects.toThrow('Error occurred');
    expect(mockContext.getLogger().error).toHaveBeenCalledWith('Workflow testWorkflow failed with status: failed');
  });

  it('throws error when workflow is not provided', async () => {
    mockTask.parameters = { input: { key: 'value' } };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(InvalidParameterError);
  });

  it('throws error when file reading fails', async () => {
    mockTask.parameters = { file: 'path/to/workflow.json', input: { key: 'value' } };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(fs.promises, 'readFile').mockRejectedValue(new Error('File read error'));
    await expect(handler.handle(input)).rejects.toThrow('File read error');
  });

  it('aborts while running sub-workflow', async () => {
    const abortController = new AbortController();
    mockTask.parameters = { workflow: { name: 'testWorkflow' }, input: { key: 'value' } };
    const input: TaskHandlerInput = {
      task: mockTask,
      context: mockContext,
      session: { ...mockSession, signal: abortController.signal },
      workflow: {} as any,
    };

    let runTimeout: NodeJS.Timeout | undefined;
    mockSession.runner.run.mockImplementation(() => {
      return new Promise((resolve) => {
        runTimeout = global.setTimeout(() => {
          resolve('result');
        }, 2000);
      });
    });

    global.setTimeout(() => {
      abortController.abort();
    }, 1000);

    const startTime = Date.now();
    await expect(handler.handle(input)).rejects.toThrow('Aborted');
    expect(Date.now() - startTime).toBeLessThan(2000);
    expect(mockSession.runner.run).toHaveBeenCalled();

    clearTimeout(runTimeout);
  });
});
