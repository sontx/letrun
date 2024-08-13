import { validateWhileTask, WhileTaskHandler } from '@src/system-task/while';
import { InvalidParameterError, RerunError, Task, TaskDef, TaskHandlerInput } from '@letrun/core';

const jest = import.meta.jest;

describe('WhileTaskHandler', () => {
  let handler: WhileTaskHandler;
  let mockContext: jest.Mocked<any>;
  let mockSession: jest.Mocked<any>;
  let mockTask: jest.Mocked<Task>;
  let mockTasksFactory: jest.Mocked<any>;

  beforeEach(() => {
    handler = new WhileTaskHandler();
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
        verbose: jest.fn(),
      }),
      getPluginManager: jest.fn().mockReturnValue({
        getOne: jest.fn().mockResolvedValue({
          run: jest.fn().mockImplementation(async (expression) => eval(expression)),
        }),
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
      parameters: {},
      output: {},
      taskDef: { loopOver: {} } as Task,
    } as unknown as jest.Mocked<Task>;
  });

  it('initializes while loop and runs first iteration for doWhile mode', async () => {
    mockTask.parameters = { expression: 'true', mode: 'doWhile' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output.iteration).toBe(1);
    expect(mockSession.setTasks).toHaveBeenCalled();
  });

  it('runs subsequent iterations for doWhile mode', async () => {
    mockTask.parameters = { expression: 'true', mode: 'doWhile' };
    mockTask.output = { iteration: 1 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(mockContext.getPluginManager(), 'getOne').mockResolvedValue({
      run: jest.fn().mockResolvedValue(true),
    });
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output.iteration).toBe(2);
    expect(mockSession.setTasks).toHaveBeenCalled();
  });

  it('stops loop when condition is false for doWhile mode', async () => {
    mockTask.parameters = { expression: 'false', mode: 'doWhile' };
    mockTask.output = { iteration: 1 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(mockContext.getPluginManager(), 'getOne').mockResolvedValue({
      run: jest.fn().mockResolvedValue(false),
    });
    const result = await handler.handle(input);
    expect(result).toEqual({ iteration: 1 });
    expect(mockSession.setTasks).not.toHaveBeenCalled();
  });

  it('initializes while loop and evaluates condition first for whileDo mode', async () => {
    mockTask.parameters = { expression: 'true', mode: 'whileDo' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(mockContext.getPluginManager(), 'getOne').mockResolvedValue({
      run: jest.fn().mockResolvedValue(true),
    });
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output.iteration).toBe(1);
    expect(mockSession.setTasks).toHaveBeenCalled();
  });

  it('stops loop when condition is false for whileDo mode', async () => {
    mockTask.parameters = { expression: 'false', mode: 'whileDo' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(mockContext.getPluginManager(), 'getOne').mockResolvedValue({
      run: jest.fn().mockResolvedValue(false),
    });
    const result = await handler.handle(input);
    expect(result).toEqual({ iteration: 0 });
    expect(mockSession.setTasks).not.toHaveBeenCalled();
  });

  it('throws error for invalid parameters', async () => {
    mockTask.parameters = { expression: 123, mode: 'invalid' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(InvalidParameterError);
  });

  it('validates while task definition with valid tasks', () => {
    const taskDef: TaskDef = { name: 'whileTask', loopOver: { task1: {} } as any } as any;
    expect(() => validateWhileTask(taskDef)).not.toThrow();
  });

  it('throws error for while task definition without tasks', () => {
    const taskDef: TaskDef = { name: 'whileTask' } as any;
    expect(() => validateWhileTask(taskDef)).toThrow(InvalidParameterError);
  });
});
