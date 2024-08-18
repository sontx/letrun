import { validateWhileTask, WhileTaskHandler } from '@src/system-task/while';
import { InvalidParameterError, RerunError, Task, TaskDef, TaskHandlerInput } from '@letrun/core';

const jest = import.meta.jest;

describe('WhileTaskHandler', () => {
  let handler: WhileTaskHandler;
  let mockContext: jest.Mocked<any>;
  let mockSession: jest.Mocked<any>;
  let mockTask: jest.Mocked<Task>;
  let mockTasksFactory: jest.Mocked<any>;
  let mockJavascriptEngine: any;

  beforeEach(() => {
    handler = new WhileTaskHandler();
    mockJavascriptEngine = {
      name: 'javascript',
      run: jest.fn().mockResolvedValue('result'),
      support: jest.fn(ex => ex === 'js'),
    };
    mockContext = {
      getLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
        verbose: jest.fn(),
      }),
      getPluginManager: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue([mockJavascriptEngine]),
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
    jest.spyOn(mockJavascriptEngine, 'run').mockResolvedValue(true);
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output.iteration).toBe(2);
    expect(mockSession.setTasks).toHaveBeenCalled();
  });

  it('stops loop when condition is false for doWhile mode', async () => {
    mockTask.parameters = { expression: 'false', mode: 'doWhile' };
    mockTask.output = { iteration: 1 };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(mockJavascriptEngine, 'run').mockResolvedValue(false);
    const result = await handler.handle(input);
    expect(result).toEqual({ iteration: 1 });
    expect(mockSession.setTasks).not.toHaveBeenCalled();
  });

  it('initializes while loop and evaluates condition first for whileDo mode', async () => {
    mockTask.parameters = { expression: 'true', mode: 'whileDo' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(mockJavascriptEngine, 'run').mockResolvedValue(true);
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(mockTask.output.iteration).toBe(1);
    expect(mockSession.setTasks).toHaveBeenCalled();
  });

  it('stops loop when condition is false for whileDo mode', async () => {
    mockTask.parameters = { expression: 'false', mode: 'whileDo' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    jest.spyOn(mockJavascriptEngine, 'run').mockResolvedValue(false);
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

  it('evaluates expression with specified language in while task handler', async () => {
    const pythonEngineMock = {
      name: 'python',
      run: jest.fn().mockResolvedValue(true),
    } as any;
    mockContext.getPluginManager().get = jest.fn().mockResolvedValue([pythonEngineMock]);
    mockTask.parameters = { expression: '2 + 2', language: 'python', mode: 'whileDo' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow(RerunError);
    expect(pythonEngineMock.run).toHaveBeenCalledWith('2 + 2', { input: { task: mockTask, workflow: {} } });
    expect(mockTask.output.iteration).toBe(1);
  });

  it('throws error when specified language is not found', async () => {
    mockContext.getPluginManager().get = jest.fn().mockResolvedValue([]);
    mockTask.parameters = { expression: '2 + 2', language: 'nonexistent', mode: 'whileDo' };
    const input: TaskHandlerInput = { task: mockTask, context: mockContext, session: mockSession, workflow: {} as any };
    await expect(handler.handle(input)).rejects.toThrow('No script engine found for language: nonexistent');
  });
});
