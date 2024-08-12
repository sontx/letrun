import { IterateTaskHandler, validateIterateTask } from './iterate';
import { RerunError, Task, TaskDef, TaskHandlerInput, InvalidParameterError } from '@letrun/core';

const jest = import.meta.jest;

describe('IterateTaskHandler', () => {
  let handler: IterateTaskHandler;
  let mockContext: jest.Mocked<any>;
  let mockSession: jest.Mocked<any>;
  let mockTask: jest.Mocked<Task>;
  let mockTasksFactory: jest.Mocked<any>;

  beforeEach(() => {
    handler = new IterateTaskHandler();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        verbose: jest.fn(),
      }),
    };
    mockTasksFactory = {
      createTasks: jest.fn().mockReturnValue({}),
    };
    mockSession = {
      setTasks: jest.fn(),
      tasksFactory: mockTasksFactory
    };
    mockTask = {
      output: {},
      parameters: {},
      taskDef: { loopOver: {} } as Task
    } as unknown as jest.Mocked<Task>;
  });

  it('initializes new iteration when no iteration exists', async () => {
    mockTask.parameters = { items: [1, 2, 3] };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output.iteration).toBe(0);
    expect(mockTask.output.item).toBe(1);
  });

  it('increments iteration and processes next item', async () => {
    mockTask.parameters = { items: [1, 2, 3] };
    mockTask.output = { iteration: 0, item: 1 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output.iteration).toBe(1);
    expect(mockTask.output.item).toBe(2);
  });

  it('completes iteration when no more items are left', async () => {
    mockTask.parameters = { items: [1, 2, 3] };
    mockTask.output = { iteration: 2, item: 3 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    const result = await handler.handle(input);
    expect(result).toEqual({ iteration: 3 });
    expect(mockTask.output.item).toBeUndefined();
  });

  it('handles iteration over a Set', async () => {
    mockTask.parameters = { items: new Set([1, 2, 3]) };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output.iteration).toBe(0);
    expect(mockTask.output.item).toBe(1);
  });

  it('handles iteration over a Map', async () => {
    mockTask.parameters = { items: new Map([['a', 1], ['b', 2], ['c', 3]]) };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output.iteration).toBe(0);
    expect(mockTask.output.item).toEqual(['a', 1]);
  });

  it('throws error for invalid parameters', async () => {
    mockTask.parameters = { items: 'invalid' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(InvalidParameterError);
  });

  it('validates iterate task definition with valid tasks', () => {
    const taskDef: TaskDef = { name: 'iterateTask', loopOver: { task1: {} } } as any;
    expect(() => validateIterateTask(taskDef)).not.toThrow();
  });

  it('throws error for iterate task definition without tasks', () => {
    const taskDef: TaskDef = { name: 'iterateTask' } as any;
    expect(() => validateIterateTask(taskDef)).toThrow(InvalidParameterError);
  });
});
