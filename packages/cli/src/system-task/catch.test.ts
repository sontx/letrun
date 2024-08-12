import { CatchTaskHandler, validateCatchTask } from './catch';
import {InvalidParameterError, Task, TaskDef, TaskHandlerInput, WorkflowTasks} from '@letrun/core';

const jest = import.meta.jest;

describe('CatchTaskHandler', () => {
  let handler: CatchTaskHandler;
  let mockContext: jest.Mocked<any>;
  let mockSession: jest.Mocked<any>;
  let mockTask: jest.Mocked<Task>;

  beforeEach(() => {
    handler = new CatchTaskHandler();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
      }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue({
          run: jest.fn().mockResolvedValue(true),
        }),
      }),
    };
    mockSession = {
      setTasks: jest.fn(),
    };
    mockTask = {
      output: {},
      parameters: {},
      delayError: undefined,
      errorTasks: undefined,
      catch: undefined,
      finally: undefined,
    } as unknown as jest.Mocked<Task>;
  });

  it('handles task execution with no errors', async () => {
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toEqual({});
  });

  it('handles task execution with no errors and calls finally block', async () => {
    mockTask.output.handledBlocks = [];
    mockTask.finally = { task1: {} } as any as WorkflowTasks;
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(handler as any, 'handleFinallyBlock').mockImplementationOnce(() => {});
    await handler.handle(input);
    expect(handler['handleFinallyBlock']).toHaveBeenCalledWith(input);
  });

  it('handles task execution with errors from execution block', async () => {
    const errorTask = { error: new Error('Execution error') } as any as Task;
    errorTask.status = 'error';
    mockTask.output.handledBlocks = [];
    mockTask.tasks = { task1: errorTask } as any;
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(handler as any, 'handleCatchBlock').mockResolvedValueOnce(undefined);
    jest.spyOn(handler as any, 'handleFinallyBlock').mockImplementationOnce(() => {});
    await handler.handle(input);
    expect(handler['handleCatchBlock']).toHaveBeenCalledWith([errorTask], input);
    expect(handler['handleFinallyBlock']).toHaveBeenCalledWith(input);
  });

  it('handles task execution with errors from catch block', async () => {
    const errorTask = { error: new Error('Catch error') } as any as Task;
    errorTask.status = 'error';
    mockTask.tasks = { task1: errorTask } as any;
    mockTask.output.handledBlocks = ['catch'];
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(handler as any, 'handleFinallyBlock').mockImplementationOnce(() => {});
    await expect(handler.handle(input)).rejects.toThrow('Catch error');
    expect(handler['handleFinallyBlock']).toHaveBeenCalledWith(input);
  });

  it('handles task execution with errors from finally block', async () => {
    const errorTask = { error: new Error('Finally error') } as any as Task;
    errorTask.status = 'error';
    mockTask.tasks = { task1: errorTask } as any;
    mockTask.output.handledBlocks = ['finally'];
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow('Finally error');
  });

  it('matches error name successfully', () => {
    const errors = [new Error('Test error')];
    errors[0]!.name = 'TestError';
    const result = handler['matchesErrorName']('TestError', errors);
    expect(result).toBe(true);
  });

  it('matches expression successfully', async () => {
    const errors = [new Error('Test error')];
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    const result = await handler['matchesExpression']('true', errors, input);
    expect(result).toBe(true);
  });

  it('validates catch task definition with valid tasks', () => {
    const taskDef: TaskDef = { name: 'catchTask', catch: [{ task2: {} }], tasks: { task1: {} } as any } as any;
    expect(() => validateCatchTask(taskDef)).not.toThrow();
  });

  it('throws error for catch task definition without tasks', () => {
    const taskDef: TaskDef = { name: 'catchTask' } as any;
    expect(() => validateCatchTask(taskDef)).toThrow(InvalidParameterError);
  });

  it('throws error for catch task definition without catch or finally', () => {
    const taskDef: TaskDef = { name: 'catchTask', tasks: { task1: {} } as any } as any;
    expect(() => validateCatchTask(taskDef)).toThrow(InvalidParameterError);
  });
});
