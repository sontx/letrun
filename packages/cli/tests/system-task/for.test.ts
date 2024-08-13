import { ForTaskHandler, validateForTask } from '@src/system-task/for';
import { InvalidParameterError, RerunError, Task, TaskDef, TaskHandlerInput } from '@letrun/core';

const jest = import.meta.jest;

describe('ForTaskHandler', () => {
  let handler: ForTaskHandler;
  let mockContext: jest.Mocked<any>;
  let mockSession: jest.Mocked<any>;
  let mockTask: jest.Mocked<Task>;
  let mockTasksFactory: jest.Mocked<any>;

  beforeEach(() => {
    handler = new ForTaskHandler();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
        verbose: jest.fn(),
      }),
    };
    mockTasksFactory = {
      createTasks: jest.fn().mockReturnValue({}),
    };
    mockSession = {
      setTasks: jest.fn(),
      tasksFactory: mockTasksFactory,
    };
    mockTask = {
      output: {},
      parameters: {},
      taskDef: { loopOver: {} } as Task,
    } as unknown as jest.Mocked<Task>;
  });

  it('initializes loop and throws RerunError for first iteration', async () => {
    mockTask.parameters = { from: 0, to: 5, step: 1 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output).toEqual({ index: 1, iteration: 1, from: 0, to: 5, step: 1 });
  });

  it('continues loop and throws RerunError for subsequent iterations', async () => {
    mockTask.parameters = { from: 0, to: 5, step: 1 };
    mockTask.output = { index: 1, iteration: 1, from: 0, to: 5, step: 1 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output).toEqual({ index: 2, iteration: 2, from: 0, to: 5, step: 1 });
  });

  it('completes loop when index exceeds to value', async () => {
    mockTask.parameters = { from: 0, to: 2, step: 1 };
    mockTask.output = { index: 3, iteration: 3, from: 0, to: 2, step: 1 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toEqual({ index: 3, iteration: 3, from: 0, to: 2, step: 1 });
  });

  it('throws error for invalid parameters', async () => {
    mockTask.parameters = { from: 'invalid', to: 5, step: 1 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(InvalidParameterError);
  });

  it('validates for task definition with valid tasks', () => {
    const taskDef: TaskDef = { name: 'forTask', loopOver: { task1: {} } as any } as any;
    expect(() => validateForTask(taskDef)).not.toThrow();
  });

  it('throws error for for task definition without tasks', () => {
    const taskDef: TaskDef = { name: 'forTask' } as any;
    expect(() => validateForTask(taskDef)).toThrow(InvalidParameterError);
  });
});
